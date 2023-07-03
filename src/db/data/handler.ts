import {
  noticeContentCrawling,
  noticeCrawling,
  noticeListCrawling,
} from '@crawling/noticeCrawling';
import { College, Notice } from 'src/@types/college';
import db from 'src/db';

export const saveDepartmentToDB = async (college: College[]): Promise<void> => {
  const saveCollegePromises = college.map((data) => {
    const saveCollegeQuery = `INSERT INTO departments (collegeName, departmentName, departmentSubName, departmentLink) VALUES ('${data.collegeName}', '${data.departmentName}', '${data.departmentSubName}', '${data.departmentLink}');`;
    return new Promise<void>((resolve, reject) => {
      db.query(saveCollegeQuery, (error) => {
        if (error) {
          console.error('데이터 입력 실패', error);
          reject(error);
        } else {
          console.log('단과대 입력 성공!');
          resolve();
        }
      });
    });
  });

  try {
    await Promise.all(saveCollegePromises);
  } catch (err) {
    console.log(err);
  }
};

const saveNotice = (notice: Notice, major: string): Promise<void> => {
  const saveNoticeQuery =
    'INSERT INTO ' +
    major +
    ' (major, title, link, content, uploadDate) VALUES (?, ?, ?, ?, ?)';
  const values = [
    major,
    notice.title,
    notice.path,
    notice.description,
    notice.date,
  ];

  return new Promise((resolve, reject) => {
    db.query(saveNoticeQuery, values, (error) => {
      if (error) {
        console.error('데이터 입력 실패', error);
        reject(error);
      } else {
        console.log('공지사항 입력 성공!');
        resolve();
      }
    });
  });
};

export const saveNoticeToDB = async (): Promise<void> => {
  const selectQuery = 'SELECT * FROM departments;';
  try {
    const results = (await new Promise((resolve, reject) => {
      db.query(selectQuery, (error, results) => {
        if (error) {
          console.error('SELECT 오류:', error);
          reject(error);
        } else {
          if (typeof results === 'string') resolve(results);
          reject('타입 에러');
        }
      });
    })) as College[];

    const savePromises: Promise<void>[] = [];

    for (const row of results) {
      const college: College = {
        collegeName: row.collegeName,
        departmentName: row.departmentName,
        departmentSubName: row.departmentSubName,
        departmentLink: row.departmentLink,
      };

      const noticeLink = await noticeCrawling(college);
      const noticeLists = await noticeListCrawling(noticeLink);
      const major =
        college.departmentSubName === '-'
          ? college.departmentName
          : college.departmentSubName;

      if (noticeLists.pinnedNotice !== undefined) {
        for (const notice of noticeLists.pinnedNotice) {
          const result = await noticeContentCrawling(notice);
          savePromises.push(saveNotice(result, major + '고정'));
        }
      }

      for (const notice of noticeLists.normalNotice) {
        const result = await noticeContentCrawling(notice);
        savePromises.push(saveNotice(result, major + '일반'));
      }
    }

    await Promise.all(savePromises);
  } catch (error) {
    console.error('에러 발생:', error);
  }
};

const saveSchoolNotice = async (notices: string[], mode: string) => {
  const query = `SELECT link FROM 학교${mode} ORDER BY uploadDate DESC LIMIT 1;`;
  const res = await new Promise<string>((resolve, reject) => {
    db.query(query, (err, res) => {
      if (err) {
        reject(err);
      } else {
        if (typeof res === 'string') resolve(res);
        reject(err);
      }
    });
  });
  const saveNoticeQuery =
    'INSERT INTO schoolnotices (title, link, content, uploadDate) VALUES (?, ?, ?, ?)';

  for (const list of notices) {
    const notice = await noticeContentCrawling(list);
    if (res === notice.path) break;

    const values = [notice.title, notice.path, notice.description, notice.date];
    db.query(saveNoticeQuery, values, (error) => {
      if (error) {
        console.error('데이터 입력 실패', error);
      } else {
        console.log('공지사항 입력 성공!');
      }
    });
  }
};

export const saveSchoolNoticeToDB = async () => {
  const pknuNoticeLink = 'https://www.pknu.ac.kr/main/163';
  const noticeLists = await noticeListCrawling(pknuNoticeLink);
  if (noticeLists.pinnedNotice !== undefined) {
    saveSchoolNotice(noticeLists.pinnedNotice, '고정');
  }
  saveSchoolNotice(noticeLists.normalNotice, '일반');
};

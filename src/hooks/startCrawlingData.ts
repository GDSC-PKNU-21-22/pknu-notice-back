import { collegeCrawling } from '@crawling/collegeCrawling';
import {
  saveDepartmentToDB,
  saveNoticeToDB,
  saveSchoolNoticeToDB,
} from '@db/data/handler';
import db from '@db/index';
import createNoticeTable from '@db/table/createMajorTable';
import { RowDataPacket } from 'mysql2';

export const initialCrawling = () => {
  try {
    const findrowsExistQuery = 'SELECT COUNT(*) FROM departments;';
    db.query(findrowsExistQuery, async (err, res) => {
      if (err) return;
      const rows = res as RowDataPacket[];
      if (rows[0]['COUNT(*)'] !== 0) return;
      const collegeList = await collegeCrawling();
      createNoticeTable(collegeList);
      await saveDepartmentToDB(collegeList);
      await saveSchoolNoticeToDB();
      await saveNoticeToDB();
    });
  } catch (err) {
    console.log(err);
  }
};

// const startNoticeCrawling = () => {};

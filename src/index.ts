import env from '@config';
import { corsOptions } from '@middlewares/cors';
import errorHandler from '@middlewares/error-handler';
import cors from 'cors';
import express, { Request, Response } from 'express';
import morgan from 'morgan';

const app = express();
app.use(morgan('dev'));
app.use(cors(corsOptions));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
app.use(express.json());
app.use(errorHandler);

setTimeout(() => {
  import('src/hooks/startCrawlingData').then((crawling) => {
    crawling.initialCrawling();
  });

  import('@apis/majorDecision/controller').then((majorRouter) => {
    app.use('/api/majorDecision', majorRouter.default);
  });

  import('@apis/suggestion/controller').then((suggestionRouter) => {
    app.use('/api/suggestion', suggestionRouter.default);
  });

  import('@apis/notice/controller').then((noticeRouter) => {
    app.use('/api/announcement', noticeRouter.default);
  });
}, 15000);

app.get('/test', (req: Request, res: Response) => {
  console.log('test');
  res.send('Hello');
});

app.listen(env.SERVER_PORT, () => {
  console.log('서버 실행중');
});

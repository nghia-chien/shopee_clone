import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';
import sellerRouter from './sellerRoutes';

const app = express();

// ✅ Cấu hình CORS — đảm bảo frontend có thể gọi API
app.use(cors({
  origin: true,            // ✅ Tự động cho phép domain đang gửi request (devtunnel, localhost, v.v)
  credentials: true,
  methods: ["GET", "POST","PATCH", "PUT", "DELETE", "OPTIONS"], // ✅ tránh preflight bị fail
}));


// ✅ Bảo mật cơ bản
app.use(helmet());

// ✅ Cho phép đọc JSON body
app.use(express.json());

// ✅ Ghi log HTTP requests
app.use(morgan('dev'));

// ✅ Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// ✅ Gắn router chính
app.use('/api', apiRouter);

app.use('/api/seller', sellerRouter);

// ✅ Xử lý 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// ✅ Middleware xử lý lỗi
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  return errorHandler(err, req, res, next);
});

export default app;

import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
	const isProd = process.env.NODE_ENV === 'production';
	const message = isProd ? 'Internal Server Error' : err.message;
	return res.status(500).json({ message });
}

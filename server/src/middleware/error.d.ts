import type { NextFunction, Request, Response } from 'express';

export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
declare const _default: typeof errorHandler;
export default _default;

export declare class HttpError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string);
}

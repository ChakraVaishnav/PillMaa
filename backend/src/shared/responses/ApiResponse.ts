// src/shared/responses/ApiResponse.ts
import { Response } from 'express';

export interface ApiResponseShape<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: ApiResponseShape<T>['meta']
  ): Response {
    const payload: ApiResponseShape<T> = {
      success: true,
      message,
      data,
    };
    if (meta) payload.meta = meta;
    return res.status(statusCode).json(payload);
  }

  static created<T>(res: Response, data: T, message: string = 'Created successfully'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: unknown
  ): Response {
    const payload: ApiResponseShape<null> = {
      success: false,
      message,
      error: {},
    };
    if (code) payload.error!.code = code;
    if (details) payload.error!.details = details;
    return res.status(statusCode).json(payload);
  }
}

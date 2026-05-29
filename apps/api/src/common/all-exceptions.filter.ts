import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter that logs all unhandled errors
 * with structured context for debugging and monitoring.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as Record<string, unknown>).message as string ?? message;
        details = (res as Record<string, unknown>).message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log 5xx errors as errors, 4xx as warnings
    const logPayload = {
      statusCode: status,
      path: request.url,
      method: request.method,
      message,
      ...(status >= 500 && exception instanceof Error ? { stack: exception.stack } : {}),
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(logPayload));
    } else if (status >= 400) {
      this.logger.warn(JSON.stringify(logPayload));
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(details) ? details : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

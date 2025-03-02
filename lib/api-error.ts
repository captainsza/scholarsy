import { NextResponse } from "next/server";

// Standard HTTP error codes with descriptions
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes specific to the application
export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  ACCOUNT_NOT_APPROVED = "ACCOUNT_NOT_APPROVED",
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  RESOURCE_ACCESS_DENIED = "RESOURCE_ACCESS_DENIED",
  
  // Resource errors
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  
  // Validation errors
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  
  // Database errors
  DATABASE_ERROR = "DATABASE_ERROR",
  QUERY_FAILED = "QUERY_FAILED",
  
  // General errors
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

// Interface for API error details
export interface ApiErrorDetail {
  field?: string;
  message: string;
  code: string;
}

// Interface for structured API error response
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: ErrorCode | string;
    statusCode: number;
    details?: ApiErrorDetail[];
    stack?: string; // Only included in development
  };
}

// Custom API error class
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode | string;
  readonly details?: ApiErrorDetail[];

  constructor(message: string, statusCode: number = 500, code: ErrorCode | string = ErrorCode.UNEXPECTED_ERROR, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // Helper to create a NextResponse from this error
  public toResponse(): NextResponse {
    const isDev = process.env.NODE_ENV === 'development';
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
        // Only include stack trace in development mode
        ...(isDev && { stack: this.stack })
      }
    };
    
    return NextResponse.json(errorResponse, { status: this.statusCode });
  }
}

// Helper functions for common error types

export function badRequest(message: string, code: string = ErrorCode.INVALID_INPUT, details?: ApiErrorDetail[]) {
  return new ApiError(message, HTTP_STATUS.BAD_REQUEST, code, details);
}

export function unauthorized(message: string = "Authentication required", code: string = ErrorCode.INVALID_CREDENTIALS) {
  return new ApiError(message, HTTP_STATUS.UNAUTHORIZED, code);
}

export function forbidden(message: string = "Access denied", code: string = ErrorCode.INSUFFICIENT_PERMISSIONS) {
  return new ApiError(message, HTTP_STATUS.FORBIDDEN, code);
}

export function notFound(message: string = "Resource not found", code: string = ErrorCode.RESOURCE_NOT_FOUND) {
  return new ApiError(message, HTTP_STATUS.NOT_FOUND, code);
}

export function conflict(message: string, code: string = ErrorCode.RESOURCE_CONFLICT) {
  return new ApiError(message, HTTP_STATUS.CONFLICT, code);
}

export function validationError(message: string, details: ApiErrorDetail[]) {
  return new ApiError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_FAILED, details);
}

export function serverError(message: string = "Internal server error", code: string = ErrorCode.UNEXPECTED_ERROR) {
  return new ApiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, code);
}

// Utility function to handle errors in API routes
export async function handleApiError(error: unknown): Promise<NextResponse> {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return error.toResponse();
  }
  
  // Handle Prisma errors
  if (typeof error === 'object' && error !== null && 'code' in error && 'meta' in error) {
    const prismaError = error as { code: string; meta?: Record<string, any> };
    
    if (prismaError.code === 'P2002') {
      return conflict('A record with this identifier already exists.', ErrorCode.RESOURCE_ALREADY_EXISTS).toResponse();
    }
    
    if (prismaError.code === 'P2025') {
      return notFound('The requested resource does not exist.').toResponse();
    }
    
    return serverError('Database error occurred.', ErrorCode.DATABASE_ERROR).toResponse();
  }
  
  // Handle other types of errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return serverError(message).toResponse();
}

// Wrapper for API handlers to automatically handle errors
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(handler: T) {
  return async function(...args: Parameters<T>): Promise<NextResponse> {
    try {
      return await handler(...args);
    } catch (error) {
      return await handleApiError(error);
    }
  };
}

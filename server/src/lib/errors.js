/** Operational error that maps straight onto the SPEC §3.1 error body. */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (message = 'Not found.') => new ApiError(404, 'NOT_FOUND', message);
export const unauthenticated = (message = 'Please log in to continue.') =>
  new ApiError(401, 'UNAUTHENTICATED', message);
export const forbidden = (message = 'You do not have access to this.') =>
  new ApiError(403, 'FORBIDDEN', message);

/**
 * NEUS SDK Error Classes
 * @license Apache-2.0
 */

/**
 * Base SDK Error Class
 */
export class SDKError extends Error {
  constructor(message, code = 'SDK_ERROR', details = {}) {
    super(message);
    this.name = 'SDKError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // Ensure proper prototype chain
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SDKError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * API-related errors (server responses, HTTP issues)
 */
export class ApiError extends SDKError {
  constructor(message, statusCode = 500, code = 'API_ERROR', response = null) {
    super(message, code);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;

    // Additional classification
    this.isClientError = statusCode >= 400 && statusCode < 500;
    this.isServerError = statusCode >= 500;
    this.isRetryable = this.isServerError || statusCode === 429; // Server errors or rate limit
  }

  static fromResponse(response, responseData) {
    const statusCode = response.status;
    const message =
      responseData?.error?.message ||
      responseData?.message ||
      `API request failed with status ${statusCode}`;
    const code = responseData?.error?.code || 'API_ERROR';

    return new ApiError(message, statusCode, code, responseData);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      isClientError: this.isClientError,
      isServerError: this.isServerError,
      isRetryable: this.isRetryable
    };
  }
}

/**
 * Client-side validation errors (invalid parameters, missing required fields)
 */
export class ValidationError extends SDKError {
  constructor(message, field = null, value = null) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.isRetryable = false; // Validation errors are not retryable
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
      isRetryable: this.isRetryable
    };
  }
}

/**
 * Network-related errors (connectivity, timeouts, DNS issues)
 */
export class NetworkError extends SDKError {
  constructor(message, code = 'NETWORK_ERROR', originalError = null) {
    super(message, code);
    this.name = 'NetworkError';
    this.originalError = originalError;
    this.isRetryable = true; // Network errors are typically retryable
  }

  static isNetworkError(error) {
    return (
      error instanceof NetworkError ||
      (error.name === 'TypeError' && error.message.includes('fetch')) ||
      error.name === 'AbortError' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT'
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      isRetryable: this.isRetryable,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            code: this.originalError.code
          }
        : null
    };
  }
}

/**
 * Configuration-related errors (missing configuration, invalid settings)
 */
export class ConfigurationError extends SDKError {
  constructor(message, configKey = null) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
    this.configKey = configKey;
    this.isRetryable = false; // Config errors require user intervention
  }

  toJSON() {
    return {
      ...super.toJSON(),
      configKey: this.configKey,
      isRetryable: this.isRetryable
    };
  }
}

/**
 * Verification-specific errors (verifier failures, invalid proofs)
 */
export class VerificationError extends SDKError {
  constructor(message, verifierId = null, code = 'VERIFICATION_ERROR') {
    super(message, code);
    this.name = 'VerificationError';
    this.verifierId = verifierId;
    this.isRetryable = true; // Some verification errors might be retryable
  }

  toJSON() {
    return {
      ...super.toJSON(),
      verifierId: this.verifierId,
      isRetryable: this.isRetryable
    };
  }
}

/**
 * Authentication-related errors (signature validation, wallet connection)
 */
export class AuthenticationError extends SDKError {
  constructor(message, code = 'AUTHENTICATION_ERROR') {
    super(message, code);
    this.name = 'AuthenticationError';
    this.isRetryable = false; // Auth errors require user intervention
  }

  toJSON() {
    return {
      ...super.toJSON(),
      isRetryable: this.isRetryable
    };
  }
}

/**
 * Utility function to create appropriate error from generic error
 */
export function createErrorFromGeneric(error, context = {}) {
  if (error instanceof SDKError) {
    return error;
  }

  // Network-related errors
  if (NetworkError.isNetworkError(error)) {
    return new NetworkError(
      error.message || 'Network error occurred',
      error.code || 'NETWORK_ERROR',
      error
    );
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return new NetworkError('Request timeout', 'TIMEOUT', error);
  }

  // Generic error wrapper
  return new SDKError(error.message || 'Unknown error occurred', error.code || 'UNKNOWN_ERROR', {
    originalError: error,
    context
  });
}

// Export all error classes as default
export default {
  SDKError,
  ApiError,
  ValidationError,
  NetworkError,
  ConfigurationError,
  VerificationError,
  AuthenticationError,
  createErrorFromGeneric
};

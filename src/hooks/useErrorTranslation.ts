/**
 * Error Translation Hook
 * Translates technical error codes and messages into user-friendly messages
 */

export type CosmoDenyReason =
  | 'permission_denied'
  | 'operation_not_allowed'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'invalid_payload'
  | 'approval_required'
  | 'loop_limit_exceeded'
  | 'model_unavailable'
  | 'authentication_required'
  | 'subscription_required'
  | 'workspace_suspended'
  | 'feature_disabled'
  | 'unknown';

interface TranslatedError {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

/**
 * Maps technical error codes/reasons to user-friendly messages
 */
const errorTranslations: Record<CosmoDenyReason, TranslatedError> = {
  permission_denied: {
    title: 'Access Denied',
    message: "You don't have permission to perform this action. Contact your workspace admin if you believe this is a mistake.",
  },
  operation_not_allowed: {
    title: 'Action Not Allowed',
    message: 'This operation is not permitted in your current context. Please try a different approach.',
  },
  rate_limited: {
    title: 'Too Many Requests',
    message: "You're making requests too quickly. Please wait a moment and try again.",
  },
  quota_exceeded: {
    title: 'Usage Limit Reached',
    message: "You've reached your usage limit for this billing period. Upgrade your plan or wait until your quota resets.",
    actionLabel: 'View Plans',
    actionHref: '/settings/billing',
  },
  invalid_payload: {
    title: 'Invalid Request',
    message: 'Something went wrong with your request. Please check your input and try again.',
  },
  approval_required: {
    title: 'Approval Needed',
    message: 'This action requires approval from an administrator before it can proceed.',
  },
  loop_limit_exceeded: {
    title: 'Process Limit Reached',
    message: 'The AI agent reached its maximum operation limit. This is a safety feature. Try breaking your request into smaller steps.',
  },
  model_unavailable: {
    title: 'AI Temporarily Unavailable',
    message: 'The AI service is temporarily busy. Your request will be processed shortly. Please try again in a few seconds.',
  },
  authentication_required: {
    title: 'Sign In Required',
    message: 'Please sign in to continue using this feature.',
    actionLabel: 'Sign In',
    actionHref: '/auth',
  },
  subscription_required: {
    title: 'Subscription Required',
    message: 'This feature requires an active subscription. Upgrade your plan to unlock it.',
    actionLabel: 'View Plans',
    actionHref: '/settings/billing',
  },
  workspace_suspended: {
    title: 'Workspace Suspended',
    message: 'This workspace has been suspended. Please contact support or check your billing status.',
    actionLabel: 'Contact Support',
    actionHref: '/settings/billing',
  },
  feature_disabled: {
    title: 'Feature Unavailable',
    message: 'This feature is currently disabled. Please contact your administrator for more information.',
  },
  unknown: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again. If the problem persists, contact support.',
  },
};

/**
 * HTTP status code to user-friendly message mapping
 */
const httpStatusTranslations: Record<number, TranslatedError> = {
  400: {
    title: 'Invalid Request',
    message: 'The request was invalid. Please check your input and try again.',
  },
  401: {
    title: 'Authentication Required',
    message: 'Your session has expired. Please sign in again.',
    actionLabel: 'Sign In',
    actionHref: '/auth',
  },
  402: {
    title: 'Payment Required',
    message: "You've exceeded your usage limits. Upgrade your plan to continue.",
    actionLabel: 'View Plans',
    actionHref: '/settings/billing',
  },
  403: {
    title: 'Access Denied',
    message: "You don't have permission to access this resource.",
  },
  404: {
    title: 'Not Found',
    message: "The requested resource could not be found. It may have been deleted or moved.",
  },
  429: {
    title: 'Too Many Requests',
    message: "You're making requests too quickly. Please wait a moment and try again.",
  },
  500: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again in a few moments.',
  },
  502: {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again shortly.',
  },
  503: {
    title: 'Service Busy',
    message: 'The service is currently experiencing high demand. Please try again in a few moments.',
  },
  504: {
    title: 'Request Timeout',
    message: 'The request took too long to process. Please try again with a simpler request.',
  },
};

/**
 * Detects the deny reason from an error object or message
 */
export function detectDenyReason(error: unknown): CosmoDenyReason {
  if (!error) return 'unknown';
  
  const errorMessage = typeof error === 'string' 
    ? error.toLowerCase()
    : (error as Error)?.message?.toLowerCase() || '';
  
  // Check for specific error patterns
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return 'rate_limited';
  }
  if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded') || errorMessage.includes('usage limit')) {
    return 'quota_exceeded';
  }
  if (errorMessage.includes('permission') || errorMessage.includes('forbidden') || errorMessage.includes('access denied')) {
    return 'permission_denied';
  }
  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') || errorMessage.includes('not authenticated')) {
    return 'authentication_required';
  }
  if (errorMessage.includes('subscription') || errorMessage.includes('upgrade')) {
    return 'subscription_required';
  }
  if (errorMessage.includes('loop') || errorMessage.includes('iteration') || errorMessage.includes('max iterations')) {
    return 'loop_limit_exceeded';
  }
  if (errorMessage.includes('model') && (errorMessage.includes('unavailable') || errorMessage.includes('busy') || errorMessage.includes('overloaded'))) {
    return 'model_unavailable';
  }
  if (errorMessage.includes('suspended')) {
    return 'workspace_suspended';
  }
  if (errorMessage.includes('disabled') || errorMessage.includes('not enabled')) {
    return 'feature_disabled';
  }
  if (errorMessage.includes('approval') || errorMessage.includes('pending approval')) {
    return 'approval_required';
  }
  if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return 'invalid_payload';
  }
  
  return 'unknown';
}

/**
 * Translates an error to a user-friendly message
 */
export function translateError(error: unknown): TranslatedError {
  // Check if it's an HTTP status code
  if (typeof error === 'number' && httpStatusTranslations[error]) {
    return httpStatusTranslations[error];
  }
  
  // Check for status in error object
  const errorObj = error as { status?: number; httpStatus?: number; code?: string; message?: string };
  const status = errorObj?.status || errorObj?.httpStatus;
  if (status && httpStatusTranslations[status]) {
    return httpStatusTranslations[status];
  }
  
  // Check for explicit code
  if (errorObj?.code && errorTranslations[errorObj.code as CosmoDenyReason]) {
    return errorTranslations[errorObj.code as CosmoDenyReason];
  }
  
  // Detect reason from message
  const reason = detectDenyReason(error);
  return errorTranslations[reason];
}

/**
 * Hook for translating errors in components
 */
export function useErrorTranslation() {
  return {
    translateError,
    detectDenyReason,
    errorTranslations,
    httpStatusTranslations,
  };
}

export default useErrorTranslation;

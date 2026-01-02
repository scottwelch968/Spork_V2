/**
 * Toast Error Utility
 * Provides user-friendly error toasts with translated messages
 */

import { toast } from "@/hooks/use-toast";
import { translateError, detectDenyReason } from "@/hooks/useErrorTranslation";

interface ToastErrorOptions {
  /** Override the error title */
  title?: string;
  /** Override the error description */
  description?: string;
  /** Duration in milliseconds (default: 5000) */
  duration?: number;
  /** Show action button if available */
  showAction?: boolean;
}

/**
 * Shows a user-friendly error toast
 * Automatically translates technical errors into friendly messages
 */
export function toastError(error: unknown, options: ToastErrorOptions = {}) {
  const translated = translateError(error);
  
  toast({
    variant: "destructive",
    title: options.title || translated.title,
    description: options.description || translated.message,
    duration: options.duration || 5000,
  });
  
  // Log the original error for debugging
  console.error('[toastError]', {
    originalError: error,
    translatedTo: translated.title,
    reason: detectDenyReason(error),
  });
}

/**
 * Shows a rate limit error toast with retry suggestion
 */
export function toastRateLimited(retryAfterMs?: number) {
  const retryText = retryAfterMs 
    ? ` Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`
    : ' Please wait a moment and try again.';
  
  toast({
    variant: "destructive",
    title: "Too Many Requests",
    description: `You're making requests too quickly.${retryText}`,
    duration: 6000,
  });
}

/**
 * Shows a quota exceeded error toast with upgrade CTA
 */
export function toastQuotaExceeded() {
  toast({
    variant: "destructive",
    title: "Usage Limit Reached",
    description: "You've reached your usage limit for this billing period. Upgrade your plan to continue.",
    duration: 8000,
  });
}

/**
 * Shows a model unavailable error toast
 */
export function toastModelUnavailable() {
  toast({
    variant: "destructive",
    title: "AI Temporarily Unavailable",
    description: "The AI service is temporarily busy. Please try again in a few seconds.",
    duration: 5000,
  });
}

/**
 * Shows an authentication required error toast
 */
export function toastAuthRequired() {
  toast({
    variant: "destructive",
    title: "Sign In Required",
    description: "Your session has expired. Please sign in again.",
    duration: 6000,
  });
}

/**
 * Shows a generic network error toast
 */
export function toastNetworkError() {
  toast({
    variant: "destructive",
    title: "Connection Error",
    description: "Unable to connect to the server. Please check your internet connection and try again.",
    duration: 5000,
  });
}

export default toastError;

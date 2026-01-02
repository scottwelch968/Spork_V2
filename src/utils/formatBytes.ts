/**
 * Format bytes into human-readable format (KB, MB, GB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get usage status color based on percentage threshold
 */
export function getUsageStatusColor(percentage: number): string {
  if (percentage >= 95) return 'text-destructive';
  if (percentage >= 80) return 'text-yellow-500';
  return 'text-green-500';
}

/**
 * Get progress bar color class based on percentage threshold
 */
export function getProgressColorClass(percentage: number): string {
  if (percentage >= 95) return '[&>div]:bg-destructive';
  if (percentage >= 80) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-green-500';
}

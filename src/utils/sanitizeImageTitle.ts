/**
 * Sanitizes an image generation prompt to create a clean filename.
 * Removes common image generation phrases and special characters.
 */
export function sanitizeImageTitle(prompt: string): string {
  // Phrases to remove (case-insensitive, at start of string)
  const phrasesToRemove = [
    /^create an image of\s*/i,
    /^create image of\s*/i,
    /^create image\s*/i,
    /^make me an image of\s*/i,
    /^make me an image\s*/i,
    /^make an image of\s*/i,
    /^make an image\s*/i,
    /^generate an image of\s*/i,
    /^generate image of\s*/i,
    /^generate image\s*/i,
    /^image of\s*/i,
    /^draw me\s*/i,
    /^draw an?\s*/i,
    /^paint me\s*/i,
    /^paint an?\s*/i,
    /^picture of\s*/i,
    /^a picture of\s*/i,
  ];

  let result = prompt;
  for (const phrase of phrasesToRemove) {
    result = result.replace(phrase, '');
  }

  // Clean up: remove special characters, normalize whitespace, truncate at word boundary
  result = result
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate to ~50 chars at word boundary
  if (result.length > 50) {
    const truncated = result.slice(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    result = lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated;
  }

  return result.trim();
}

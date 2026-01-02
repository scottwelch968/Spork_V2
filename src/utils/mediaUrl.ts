const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jbefxpxvnwpgqonjaznr.supabase.co';

export const getAppMediaUrl = (path: string): string => {
  return `${SUPABASE_URL}/storage/v1/object/public/app-media/${path}`;
};

export const MEDIA_PATHS = {
  logo: 'branding/spork-logo.png',
  personaAvatar: 'templates/persona-avatar.png',
  loginHero: 'branding/login-hero.jpeg',
  spaceCardBg: 'templates/space-card-bg.jpg'
} as const;

/**
 * @deprecated Avatar paths are now stored in the database (persona_templates.image_url)
 * These paths are kept for reference and migration purposes only.
 * Use the image_url field from persona_templates table instead.
 */
export const AVATAR_PATHS = [
  'templates/avatars/avatar_man_01.png',
  'templates/avatars/avatar_man_02.png',
  'templates/avatars/avatar_man_03.png',
  'templates/avatars/avatar_man_04.png',
  'templates/avatars/avatar_man_05.png',
  'templates/avatars/avatar_woman_01.png',
  'templates/avatars/avatar_woman_02.png',
  'templates/avatars/avatar_woman_03.png',
  'templates/avatars/avatar_woman_04.png',
  'templates/avatars/avatar_woman_05.png',
] as const;

/**
 * @deprecated Color palettes are now stored in the database (persona_templates.color_code)
 * These colors are kept for reference and migration purposes only.
 * Use the color_code field from persona_templates table instead.
 */
export const AVATAR_COLORS = {
  man: ['bg-blue-500', 'bg-gray-500', 'bg-slate-600', 'bg-blue-600', 'bg-gray-600'],
  woman: ['bg-pink-500', 'bg-yellow-500', 'bg-orange-500', 'bg-rose-500', 'bg-amber-500'],
} as const;

/**
 * @deprecated Use the image_url and color_code fields from persona_templates table instead.
 * This function is kept for backwards compatibility during migration.
 * New code should read avatar info directly from the database.
 */
export const getPersonaAvatarInfo = (templateId: string): { url: string; color: string; isMan: boolean } => {
  let hash = 0;
  for (let i = 0; i < templateId.length; i++) {
    hash = ((hash << 5) - hash) + templateId.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % AVATAR_PATHS.length;
  const avatarPath = AVATAR_PATHS[index];
  const isMan = avatarPath.includes('avatar_man');
  const colorPalette = isMan ? AVATAR_COLORS.man : AVATAR_COLORS.woman;
  const colorIndex = Math.abs(hash) % colorPalette.length;
  
  return {
    url: getAppMediaUrl(avatarPath),
    color: colorPalette[colorIndex],
    isMan
  };
};

/**
 * @deprecated Use the image_url field from persona_templates table instead.
 * This function is kept for backwards compatibility during migration.
 */
export const getPersonaAvatarUrl = (templateId: string): string => {
  return getPersonaAvatarInfo(templateId).url;
};

export type MediaPath = typeof MEDIA_PATHS[keyof typeof MEDIA_PATHS];

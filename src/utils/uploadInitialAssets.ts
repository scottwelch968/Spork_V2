import { supabase } from '@/integrations/supabase/client';

// Import the local assets
import paladinLogo from '@/assets/paladin-logo.png';
import personaAvatar from '@/assets/persona-avatar.png';
import loginHero from '@/assets/login-hero.jpeg';
import spaceCardBg from '@/assets/space-card-bg.jpg';

// Import avatar images
import avatarMan01 from '@/assets/avatars/avatar_man_01.png';
import avatarMan02 from '@/assets/avatars/avatar_man_02.png';
import avatarMan03 from '@/assets/avatars/avatar_man_03.png';
import avatarMan04 from '@/assets/avatars/avatar_man_04.png';
import avatarMan05 from '@/assets/avatars/avatar_man_05.png';
import avatarWoman01 from '@/assets/avatars/avatar_woman_01.png';
import avatarWoman02 from '@/assets/avatars/avatar_woman_02.png';
import avatarWoman03 from '@/assets/avatars/avatar_woman_03.png';
import avatarWoman04 from '@/assets/avatars/avatar_woman_04.png';
import avatarWoman05 from '@/assets/avatars/avatar_woman_05.png';

interface AssetUploadResult {
  uploaded: string[];
  failed: { path: string; error: string }[];
}

async function fetchAsBase64(url: string): Promise<{ data: string; contentType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve({
        data: base64,
        contentType: blob.type
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function uploadInitialAssets(): Promise<AssetUploadResult> {
  const assets = [
    { path: 'branding/spork-logo.png', sourceUrl: paladinLogo, contentType: 'image/png' },
    { path: 'templates/persona-avatar.png', sourceUrl: personaAvatar, contentType: 'image/png' },
    { path: 'branding/login-hero.jpeg', sourceUrl: loginHero, contentType: 'image/jpeg' },
    { path: 'templates/space-card-bg.jpg', sourceUrl: spaceCardBg, contentType: 'image/jpeg' },
    // Avatar images
    { path: 'templates/avatars/avatar_man_01.png', sourceUrl: avatarMan01, contentType: 'image/png' },
    { path: 'templates/avatars/avatar_man_02.png', sourceUrl: avatarMan02, contentType: 'image/png' },
    { path: 'templates/avatars/avatar_man_03.png', sourceUrl: avatarMan03, contentType: 'image/png' },
    { path: 'templates/avatars/avatar_man_04.png', sourceUrl: avatarMan04, contentType: 'image/png' },
    { path: 'templates/avatars/avatar_man_05.png', sourceUrl: avatarMan05, contentType: 'image/png' },
    { path: 'templates/avatars/avatar_woman_01.png', sourceUrl: avatarWoman01, contentType: 'image/png' },
    { path: 'templates/avatars/avatar_woman_02.png', sourceUrl: avatarWoman02, contentType: 'image/png' },
    { path: 'templates/avatars/avatar_woman_03.png', sourceUrl: avatarWoman03, contentType: 'image/png' },
    { path: 'templates/avatars/avatar_woman_04.png', sourceUrl: avatarWoman04, contentType: 'image/png' },
    { path: 'templates/avatars/avatar_woman_05.png', sourceUrl: avatarWoman05, contentType: 'image/png' },
  ];

  const results: AssetUploadResult = {
    uploaded: [],
    failed: []
  };

  for (const asset of assets) {
    try {
      const { data, contentType } = await fetchAsBase64(asset.sourceUrl);
      const base64Data = data.replace(/^data:[^;]+;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error } = await supabase.storage
        .from('app-media')
        .upload(asset.path, bytes, {
          contentType: contentType || asset.contentType,
          upsert: true
        });

      if (error) {
        results.failed.push({ path: asset.path, error: error.message });
      } else {
        results.uploaded.push(asset.path);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      results.failed.push({ path: asset.path, error: errMsg });
    }
  }

  return results;
}

export async function checkAssetsExist(): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from('app-media')
    .list('branding');
  
  if (error) return false;
  return (data?.length || 0) > 0;
}

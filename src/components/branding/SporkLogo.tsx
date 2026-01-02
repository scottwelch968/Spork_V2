import React from 'react';
import { getAppMediaUrl, MEDIA_PATHS } from '@/utils/mediaUrl';

type SporkLogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const SporkLogo: React.FC<SporkLogoProps> = ({ 
  className = '',
  size = 'md',
  showText = true
}) => {
  const iconSizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto'
  };

  const logoUrl = getAppMediaUrl(MEDIA_PATHS.logo);

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <img 
        src={logoUrl} 
        alt="Spork Logo"
        className={`${iconSizeClasses[size]}`}
        style={{ 
          filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1))',
          objectFit: 'contain'
        }}
      />
      {showText && (
        <span className="font-crete-round text-2xl" style={{ color: '#534AC9' }}>Spork</span>
      )}
    </div>
  );
};

export default SporkLogo;

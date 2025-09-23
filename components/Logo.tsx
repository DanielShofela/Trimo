import React from 'react';

interface LogoProps {
  className?: string;
  isDark?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className, isDark = false }) => {
  const headerImage = isDark ? './HeaderTrimo2.png' : './HeaderTrimo.png';
  
  return (
    <img
      src={headerImage}
      alt="Trimo"
      className={className}
      style={{ 
        height: '40px',
        transform: 'scale(2.2)',
        transformOrigin: 'left center',
        marginRight: '24px'
      }}
    />
  );
};

export default Logo;
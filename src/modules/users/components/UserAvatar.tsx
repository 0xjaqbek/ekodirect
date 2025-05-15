// src/modules/users/components/UserAvatar.tsx
import React from 'react';
import classNames from 'classnames';

interface UserAvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'Avatar użytkownika',
  initials = '',
  size = 'md',
  className = '',
  onClick
}) => {
  // Mapowanie rozmiaru na klasy Tailwind
  const sizeClasses = {
    xs: 'h-8 w-8 text-xs',
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-xl'
  };

  return (
    <div
      className={classNames(
        sizeClasses[size],
        'rounded-full overflow-hidden flex items-center justify-center',
        src ? '' : 'bg-primary text-white',
        onClick ? 'cursor-pointer' : '',
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-medium">{initials}</span>
      )}
    </div>
  );
};

export default UserAvatar;

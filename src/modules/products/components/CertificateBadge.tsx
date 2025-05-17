// src/modules/products/components/CertificateBadge.tsx
import React, { type JSX } from 'react';
import classNames from 'classnames';
import { type CertificateType } from '../../../shared/types';

interface CertificateBadgeProps {
  type: CertificateType | string;
  small?: boolean;
  className?: string;
}

const CertificateBadge: React.FC<CertificateBadgeProps> = ({
  type,
  small = false,
  className = ''
}) => {
  // Map certificate type to display text
  const certificateText: Record<string, string> = {
    'organic': 'Organiczny',
    'eco': 'Ekologiczny',
    'fair-trade': 'Fair Trade',
    'other': 'Certyfikowany'
  };

  // Map certificate type to styles
  const certificateStyles: Record<string, string> = {
    'organic': 'bg-green-100 text-green-800',
    'eco': 'bg-teal-100 text-teal-800',
    'fair-trade': 'bg-blue-100 text-blue-800',
    'other': 'bg-gray-100 text-gray-800'
  };

  // Map certificate type to icon path
  const certificateIcons: Record<string, JSX.Element> = {
    'organic': (
      <svg
        className={classNames(
          small ? "h-3 w-3" : "h-4 w-4",
          "text-green-500"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    'eco': (
      <svg
        className={classNames(
          small ? "h-3 w-3" : "h-4 w-4",
          "text-teal-500"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    'fair-trade': (
      <svg
        className={classNames(
          small ? "h-3 w-3" : "h-4 w-4",
          "text-blue-500"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    'other': (
      <svg
        className={classNames(
          small ? "h-3 w-3" : "h-4 w-4",
          "text-gray-500"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    )
  };

  // Get the certificate values (default to 'other' if not found)
  const certType = type in certificateText ? type : 'other';
  const text = certificateText[certType];
  const style = certificateStyles[certType];
  const icon = certificateIcons[certType];

  return (
    <div
      className={classNames(
        "inline-flex items-center rounded-full",
        small ? "px-2 py-0.5" : "px-3 py-1",
        style,
        className
      )}
    >
      {icon}
      <span className={classNames(
        small ? "ml-1 text-xs" : "ml-2 text-sm",
        "font-medium"
      )}>
        {text}
      </span>
    </div>
  );
};

export default CertificateBadge;
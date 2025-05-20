// src/modules/orders/components/CarbonFootprintInfo.tsx
import React from 'react';
import { formatCarbonFootprint } from '../../../shared/utils';

interface CarbonFootprintInfoProps {
  footprint: number;
  className?: string;
}

const CarbonFootprintInfo: React.FC<CarbonFootprintInfoProps> = ({
  footprint,
  className = ''
}) => {
  // Helper function to determine the footprint level
  const getFootprintLevel = (value: number): 'low' | 'medium' | 'high' => {
    if (value < 5) return 'low';
    if (value < 15) return 'medium';
    return 'high';
  };
  
  const level = getFootprintLevel(footprint);
  
  // Style and text based on the footprint level
  const levelInfo = {
    low: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: (
        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      message: 'Niski ślad węglowy! Doskonały wybór dla środowiska.'
    },
    medium: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: (
        <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      message: 'Średni ślad węglowy. Całkiem nieźle!'
    },
    high: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: (
        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      message: 'Wysoki ślad węglowy. Rozważ zakupy od bliższych producentów.'
    }
  };
  
  const { color, bgColor, icon, message } = levelInfo[level];
  
  return (
    <div className={`${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-2">Wpływ na środowisko</h3>
      
      <div className={`${bgColor} ${color} rounded-md p-3 flex items-start`}>
        <div className="mr-3 flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">
            Ślad węglowy: {formatCarbonFootprint(footprint)}
          </p>
          <p className="text-sm mt-1">
            {message}
          </p>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Obliczony na podstawie odległości transportu i rodzaju produktów.
      </p>
    </div>
  );
};

export default CarbonFootprintInfo;
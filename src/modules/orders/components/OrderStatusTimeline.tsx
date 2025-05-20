// src/modules/orders/components/OrderStatusTimeline.tsx
import React from 'react';
import { formatDate } from '../../../shared/utils';
import { ORDER_STATUSES } from '../../../shared/constants';
import type { StatusHistoryItem } from '../../../shared/types';

interface OrderStatusTimelineProps {
  statusHistory: StatusHistoryItem[];
  className?: string;
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  statusHistory,
  className = ''
}) => {
  // Sort status history by timestamp (newest first)
  const sortedHistory = [...statusHistory].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Map status to display text and icon
  const statusInfo: Record<string, { title: string; icon: React.ReactNode }> = {
    [ORDER_STATUSES.PENDING]: {
      title: 'Zamówienie złożone',
      icon: (
        <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    [ORDER_STATUSES.PAID]: {
      title: 'Płatność potwierdzona',
      icon: (
        <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    [ORDER_STATUSES.PROCESSING]: {
      title: 'Zamówienie w realizacji',
      icon: (
        <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    [ORDER_STATUSES.SHIPPED]: {
      title: 'Zamówienie wysłane',
      icon: (
        <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    },
    [ORDER_STATUSES.DELIVERED]: {
      title: 'Zamówienie dostarczone',
      icon: (
        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    [ORDER_STATUSES.CANCELLED]: {
      title: 'Zamówienie anulowane',
      icon: (
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">Historia zamówienia</h3>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {sortedHistory.map((status, index) => {
            const isLast = index === sortedHistory.length - 1;
            const statusData = statusInfo[status.status] || {
              title: status.status,
              icon: (
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            };
            
            return (
              <li key={index}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                        {statusData.icon}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {statusData.title}
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {formatDate(status.timestamp)}
                        </p>
                      </div>
                      {status.note && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p>{status.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default OrderStatusTimeline;
import React from 'react';
import { BaseComponentProps, StatusType } from '../../types';
import { Button } from './Button';

interface StatusMessageProps extends BaseComponentProps {
  type: StatusType;
  title?: string;
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: string;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  title,
  message,
  description,
  action,
  dismissible = false,
  onDismiss,
  icon,
  className = '',
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: icon || '✅',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: icon || '❌',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: icon || '⚠️',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: icon || 'ℹ️',
        };
      case 'loading':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: icon || '⏳',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: icon || '📝',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`rounded-lg border p-4 ${styles.bg} ${styles.border} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">{styles.icon}</span>
        </div>

        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className={`text-sm font-medium ${styles.text} mb-1`}>
                  {title}
                </h3>
              )}
              <p className={`text-sm ${styles.text}`}>
                {message}
              </p>
              {description && (
                <p className={`text-sm mt-1 opacity-75 ${styles.text}`}>
                  {description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {action && (
                <Button
                  size="sm"
                  variant={type === 'error' ? 'danger' : 'primary'}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )}

              {dismissible && onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors ${styles.text}`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
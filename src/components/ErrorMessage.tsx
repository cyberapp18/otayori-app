import React from 'react';
import { BRAND, COPY } from '@/constants/brand';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title, 
  message = COPY.messages.error, 
  type = 'error',
  onRetry 
}) => {
  const statusClass = type === 'error' ? BRAND.status.warning : 
                     type === 'warning' ? BRAND.status.warning : 
                     BRAND.status.info;

  return (
    <div className={`${BRAND.components.card} ${statusClass} border`}>
      {title && (
        <h3 className={`${BRAND.typography.h4} mb-2`}>
          {title}
        </h3>
      )}
      <p className={`${BRAND.typography.body} mb-4`}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={BRAND.components.button.primary}
        >
          {COPY.cta.retry}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

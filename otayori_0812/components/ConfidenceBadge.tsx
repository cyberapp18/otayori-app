
import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score }) => {
  const percentage = Math.round(score * 100);
  let colorClasses = '';

  if (percentage >= 90) {
    colorClasses = 'bg-green-100 text-green-800';
  } else if (percentage >= 70) {
    colorClasses = 'bg-yellow-100 text-yellow-800';
  } else {
    colorClasses = 'bg-red-100 text-red-800';
  }

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
      {percentage}%
    </span>
  );
};

export default ConfidenceBadge;

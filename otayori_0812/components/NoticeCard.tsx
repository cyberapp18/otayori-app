
import React from 'react';
import { Link } from 'react-router-dom';
import { Notice, NewsletterAction } from '../types';
import { ChevronRightIcon, PinIcon } from './Icon';

const getNoticeImportance = (actions: NewsletterAction[]): 'high' | 'medium' | 'low' => {
  if (actions.some(a => a.importance === 'high')) return 'high';
  if (actions.some(a => a.importance === 'medium')) return 'medium';
  return 'low';
};

const getSoonestDueDate = (actions: NewsletterAction[]): string | null => {
  const dueDates = actions
    .map(a => a.due_date)
    .filter((d): d is string => d !== null && d !== undefined)
    .sort();
  return dueDates.length > 0 ? dueDates[0] : null;
};

interface NoticeCardProps {
  notice: Notice;
}

const NoticeCard: React.FC<NoticeCardProps> = ({ notice }) => {
  const { extractJson, id, pinned } = notice;

  const importance = getNoticeImportance(extractJson.actions);
  const soonestDueDate = getSoonestDueDate(extractJson.actions);

  const importanceClasses = {
    high: 'border-red-500',
    medium: 'border-yellow-500',
    low: 'border-gray-300',
  };

  return (
    <Link to={`/notice/${id}`} className="block">
      <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 ${importanceClasses[importance]}`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                {pinned && <PinIcon className="w-4 h-4 text-gray-500" />}
                <p className="text-sm font-medium text-orange-600 truncate">{extractJson.header.class_name || 'おしらせ'}</p>
            </div>
            <h3 className="text-lg font-bold text-gray-800 truncate mt-1">{extractJson.header.title || '無題の通知'}</h3>
            {soonestDueDate ? (
              <p className="text-sm text-red-600 font-medium mt-2">
                締切: {soonestDueDate} 他
              </p>
            ) : (
               extractJson.key_points.length > 0 && (
                <p className="text-sm text-gray-500 mt-2 truncate">
                  {extractJson.key_points[0]}
                </p>
              )
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <ChevronRightIcon className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NoticeCard;

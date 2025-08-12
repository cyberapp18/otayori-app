
import React from 'react';
import { ClassNewsletterSchema, NewsletterAction, NewsletterInfo } from '../types';
import ConfidenceBadge from './ConfidenceBadge';
import { CheckCircleIcon } from './Icon';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-800 border-b-2 border-orange-200 pb-2 mb-3">{title}</h4>
        {children}
    </div>
);

const ActionItem: React.FC<{ action: NewsletterAction }> = ({ action }) => (
    <div className="bg-orange-50/50 p-4 rounded-lg mb-3 border border-orange-100">
        <div className="flex items-center gap-2">
            <p className="font-bold text-gray-800">{action.event_name}</p>
            {action.is_continuation && <span className="flex-shrink-0 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">継続</span>}
        </div>
        <div className="text-sm text-gray-600 mt-2 space-y-1">
            {action.event_date && <div>日付: {action.event_date} <ConfidenceBadge score={action.confidence.date} /></div>}
            {action.due_date && <div className="font-semibold">締切: {action.due_date} <ConfidenceBadge score={action.confidence.due} /></div>}
            {action.items.length > 0 && <div>持ち物: {action.items.join(', ')} <ConfidenceBadge score={action.confidence.items} /></div>}
            {action.fee && <p>費用: {action.fee}</p>}
        </div>
    </div>
);

const InfoItem: React.FC<{ info: NewsletterInfo }> = ({ info }) => (
    <div className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-100">
        <p className="font-semibold text-gray-700">{info.title}</p>
        <p className="text-sm text-gray-500 mt-1">{info.summary}</p>
    </div>
);

const ExtractPreview: React.FC<{ data: ClassNewsletterSchema }> = ({ data }) => {
  const { header, overview, key_points, actions, infos } = data;

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-4 sm:p-6 bg-orange-500 text-white">
            <h3 className="text-2xl leading-6 font-bold">{header.title || 'クラスだより'}</h3>
            <p className="mt-1 max-w-2xl text-sm text-orange-100">{header.class_name}・{header.issue_date}</p>
        </div>
        <div className="p-4 sm:p-6">
            <Section title="AIによる概要">
                <p className="text-gray-700 leading-relaxed">{overview}</p>
            </Section>

            <Section title="重要ポイント">
                <ul className="space-y-2">
                    {key_points.map((point, index) => (
                        <li key={index} className="flex items-start">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-800">{point}</span>
                        </li>
                    ))}
                </ul>
            </Section>

            {actions.length > 0 && (
                <Section title="やるべきこと (TODO/イベント)">
                    {actions.map((action, index) => <ActionItem key={index} action={action} />)}
                </Section>
            )}

            {infos.length > 0 && (
                <Section title="その他のお知らせ">
                     {infos.map((info, index) => <InfoItem key={index} info={info} />)}
                </Section>
            )}
        </div>
    </div>
  );
};

export default ExtractPreview;
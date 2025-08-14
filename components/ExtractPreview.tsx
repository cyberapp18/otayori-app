// components/ExtractPreview.tsx
import React from 'react';
import type { ClassNewsletterSchema } from '../types';
import ConfidenceBadge from './ConfidenceBadge';
import { CheckCircleIcon } from './Icon';

type UTodo   = { id?: string; title: string; dueDate?: string | null; priority?: string; completed?: boolean };
type UEvent  = { id?: string; title: string; date?: string | null; time?: string | null; location?: string | null; description?: string | null };
type UNotice = { id?: string; title: string; content: string; importance?: string };
type UData   = { title: string; subtitle?: string; summary: string; keyPoints: string[]; todos: UTodo[]; events: UEvent[]; notices: UNotice[] };

// 旧（header/overview/…）・新（title/summary/…）どちらでも受ける
function adaptToUnified(data: any): UData {
  if (!data || typeof data !== 'object') {
    return { title: 'おたより', summary: '内容を分析しました', keyPoints: [], todos: [], events: [], notices: [] };
  }
  const title =
    data.title ??
    data.header?.title ??
    data.headline ??
    data.newsletterTitle ??
    'おたより';

  const subtitleParts = [
    data.header?.class_name,
    data.header?.issue_date,
    data.meta?.date,
  ].filter(Boolean);
  const subtitle = subtitleParts.length ? subtitleParts.join('・') : undefined;

  const summary = data.overview ?? data.summary ?? data.excerpt ?? data.body ?? '内容を分析しました';

  const keyPoints: string[] = Array.isArray(data.key_points)
    ? data.key_points.filter((p: any) => typeof p === 'string')
    : [];

  const todoSrc =
    (Array.isArray(data.todos) && data.todos) ||
    (Array.isArray(data.tasks) && data.tasks) ||
    (Array.isArray(data.actions) && data.actions) ||
    [];
  const todos: UTodo[] = todoSrc.map((t: any) => {
    const title =
      t?.title ??
      t?.task ??
      t?.event_name ??
      (typeof t === 'string' ? t : '要確認');
    const dueDate = t?.dueDate ?? t?.deadline ?? t?.due_date ?? t?.event_date ?? null;
    const priority = t?.priority ?? t?.importance ?? 'medium';
    const completed = !!(t?.completed ?? t?.done);
    return { id: t?.id, title, dueDate, priority, completed };
  }).filter((t: UTodo) => !!t.title);

  const eventsSrc =
    (Array.isArray(data.events) && data.events) ||
    (Array.isArray(data.actions) && data.actions) ||
    [];
  const events: UEvent[] = eventsSrc
    .map((e: any) => {
      const title = e?.title ?? e?.event_name ?? null;
      if (!title) return null;
      return {
        id: e?.id,
        title,
        date: e?.date ?? e?.event_date ?? null,
        time: e?.time ?? null,
        location: e?.location ?? null,
        description: e?.description ?? e?.content ?? null,
      };
    })
    .filter(Boolean) as UEvent[];

  const noticesSrc =
    (Array.isArray(data.notices) && data.notices) ||
    (Array.isArray(data.infos) && data.infos) ||
    [];
  const notices: UNotice[] = noticesSrc.map((n: any) => ({
    id: n?.id,
    title: n?.title ?? 'お知らせ',
    content: n?.content ?? n?.summary ?? n?.description ?? '',
    importance: n?.importance ?? 'normal',
  }));

  return { title, subtitle, summary, keyPoints, todos, events, notices };
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h4 className="text-lg font-bold text-gray-800 border-b-2 border-orange-200 pb-2 mb-3">{title}</h4>
    {children}
  </div>
);

const ExtractPreview: React.FC<{ data: ClassNewsletterSchema | any }> = ({ data }) => {
  const u = adaptToUnified(data);

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="p-4 sm:p-6 bg-orange-500 text-white">
        <h3 className="text-2xl leading-6 font-bold">{u.title}</h3>
        {!!u.subtitle && <p className="mt-1 max-w-2xl text-sm text-orange-100">{u.subtitle}</p>}
      </div>

      <div className="p-4 sm:p-6">
        <Section title="AIによる概要">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{u.summary}</p>
        </Section>

        {u.keyPoints.length > 0 && (
          <Section title="重要ポイント">
            <ul className="space-y-2">
              {u.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-800">{point}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {u.todos.length > 0 && (
          <Section title={`やること (${u.todos.length}件)`}>
            <div className="space-y-2">
              {u.todos.map((t, i) => (
                <div key={t.id ?? i} className="flex items-center p-3 bg-yellow-50 rounded border border-yellow-100">
                  <input type="checkbox" className="mr-3" checked={!!t.completed} disabled />
                  <div className="flex-1">
                    <span className="font-medium">{t.title}</span>
                    {t.dueDate && <span className="text-sm text-red-600 ml-2">期限: {t.dueDate}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {u.events.length > 0 && (
          <Section title={`イベント (${u.events.length}件)`}>
            {u.events.map((e, i) => (
              <div key={e.id ?? i} className="border-l-4 border-blue-500 pl-4 mb-3 bg-blue-50 p-3 rounded">
                <h5 className="font-medium">{e.title}</h5>
                <div className="text-sm text-blue-700 space-x-3">
                  {e.date && <span>📅 {e.date}</span>}
                  {e.time && <span>🕐 {e.time}</span>}
                  {e.location && <span>📍 {e.location}</span>}
                </div>
                {e.description && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{e.description}</p>}
              </div>
            ))}
          </Section>
        )}

        {u.notices.length > 0 && (
          <Section title={`お知らせ (${u.notices.length}件)`}>
            {u.notices.map((n, i) => (
              <div key={n.id ?? i} className="mb-2 p-3 bg-green-50 rounded border border-green-100">
                <h5 className="font-medium">{n.title}</h5>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </Section>
        )}

        {u.keyPoints.length === 0 && u.todos.length === 0 && u.events.length === 0 && u.notices.length === 0 && (
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-gray-500">具体的なアクションは検出されませんでしたが、概要は正常に分析できました。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractPreview;

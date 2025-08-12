
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../App';
import Button from '../components/Button';
import { PinIcon, CheckCircleIcon } from '../components/Icon';
import { NewsletterAction, NewsletterInfo } from '../types';

const ActionItem: React.FC<{ action: NewsletterAction }> = ({ action }) => (
    <div className="bg-orange-50 p-4 rounded-lg mb-3 border border-orange-200">
        <div className="flex items-center gap-2">
            <p className="font-bold text-gray-800">{action.event_name}</p>
            {action.is_continuation && <span className="flex-shrink-0 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">継続</span>}
        </div>
        <div className="text-sm text-gray-600 mt-2 space-y-1">
            {action.event_date && <p><b>日付:</b> {action.event_date}</p>}
            {action.due_date && <p><b>締切:</b> <span className="text-red-600 font-semibold">{action.due_date}</span></p>}
            {action.items.length > 0 && <p><b>持ち物:</b> {action.items.join(', ')}</p>}
            {action.fee && <p><b>費用:</b> {action.fee}</p>}
            {action.notes && <p className="mt-2 text-xs text-gray-500"><i>補足: {action.notes}</i></p>}
        </div>
    </div>
);

const InfoItem: React.FC<{ info: NewsletterInfo }> = ({ info }) => (
    <div className="bg-gray-100 p-3 rounded-lg mb-2">
        <p className="font-semibold text-gray-700">{info.title}</p>
        <p className="text-sm text-gray-500 mt-1">{info.summary}</p>
    </div>
);


const NoticeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { notices, setNotices, isAuthenticated, imageRetention, children } = useAppContext();
  const notice = notices.find(n => n.id === id);
  const [showOriginalImage, setShowOriginalImage] = useState(false);

  if (!notice) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold">おしらせが見つかりません</h2>
        <Link to="/" className="text-orange-600 hover:underline mt-4 inline-block">ダッシュボードに戻る</Link>
      </div>
    );
  }

  const { extractJson, summary, pinned, originalImage, childIds } = notice;

  const childNames = childIds
    ?.map(id => children.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join('・');

  const togglePin = () => {
    if (!isAuthenticated) return; // Guests can't pin
    setNotices(notices.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };
  
  const ImageModal = () => (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={() => setShowOriginalImage(false)}
    >
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
            <img src={originalImage!} alt="元の画像" className="object-contain w-full h-full max-h-[calc(90vh-4rem)] rounded-lg"/>
            <button 
                onClick={() => setShowOriginalImage(false)}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 text-gray-700 hover:bg-gray-200 shadow-lg"
                aria-label="閉じる"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </div>
  );

  return (
    <>
      {showOriginalImage && originalImage && <ImageModal />}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
              <div>
                  <p className="font-semibold text-orange-600">{extractJson.header.class_name || 'おしらせ'}</p>
                  <h1 className="text-3xl font-extrabold text-gray-900 mt-1">{extractJson.header.title || '無題の通知'}</h1>
                  <p className="text-sm text-gray-500 mt-1">{extractJson.header.issue_date}</p>
                  {childNames && (
                    <div className="mt-2 inline-flex items-center bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                        対象: {childNames}
                    </div>
                  )}
              </div>
              <button 
                  onClick={togglePin} 
                  className={`p-2 rounded-full transition-colors ${pinned ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!isAuthenticated}
                  title={isAuthenticated ? (pinned ? "ピンを外す" : "ピン留めする") : "ログインが必要です"}
              >
                  <PinIcon className="w-6 h-6"/>
              </button>
          </div>

          <div className="mt-6 p-4 bg-orange-50 rounded-lg">
            <h2 className="font-bold text-lg text-gray-800">AIによる概要</h2>
            <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>

          <div className="mt-8">
              <h2 className="font-bold text-lg text-gray-800 mb-4">重要ポイント</h2>
              <ul className="space-y-2">
                  {extractJson.key_points.map((point, index) => (
                      <li key={index} className="flex items-start">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-800">{point}</span>
                      </li>
                  ))}
              </ul>
          </div>
          
          {extractJson.actions.length > 0 && (
              <div className="mt-8">
                  <h2 className="font-bold text-lg text-gray-800 mb-4">やるべきこと</h2>
                  {extractJson.actions.map((action, index) => <ActionItem key={index} action={action} />)}
              </div>
          )}

          {extractJson.infos.length > 0 && (
              <div className="mt-8">
                  <h2 className="font-bold text-lg text-gray-800 mb-4">その他のお知らせ</h2>
                  {extractJson.infos.map((info, index) => <InfoItem key={index} info={info} />)}
              </div>
          )}

          <div className="mt-8">
              {imageRetention && originalImage && (
                <Button variant="secondary" onClick={() => setShowOriginalImage(true)}>
                  元の画像を表示
                </Button>
              )}
          </div>
          
        </div>
      </div>
    </>
  );
};

export default NoticeDetailPage;
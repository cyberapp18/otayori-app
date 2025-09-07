import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { AnalysisService, AnalysisRecord } from '../services/analysisService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import ConfidenceBadge from '../components/ConfidenceBadge';
import { ChevronRightIcon, CalendarIcon, ClockIcon, CheckCircleIcon } from '../components/Icon';

const AnalysisDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAppContext();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      // 認証ローディング中は待機
      if (isLoading) {
        return;
      }

      // 認証されていない場合
      if (!isAuthenticated || !user || !id) {
        setError('認証が必要です');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const analysisData = await AnalysisService.getAnalysisById(id);
        
        if (!analysisData || analysisData.userId !== user.uid) {
          setError('解析結果が見つかりません');
          return;
        }

        setAnalysis(analysisData);
        setError(null);
      } catch (err) {
        console.error('Error loading analysis:', err);
        setError('解析結果の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [id, user, isAuthenticated, isLoading]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    }).format(date);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
            >
              <ChevronRightIcon className="h-5 w-5 mr-2 rotate-180" />
              ダッシュボードに戻る
            </button>
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">エラー</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleBack}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { extractedData } = analysis;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー部分 */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ChevronRightIcon className="h-5 w-5 mr-2 rotate-180" />
              ダッシュボードに戻る
            </button>
            <h1 className="text-2xl font-bold text-gray-900">解析結果詳細</h1>
            <p className="text-gray-600 mt-2">
              解析日時: {formatDate(analysis.createdAt)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左側: 画像表示 */}
            <div className="space-y-6">
              {analysis.imageDataUrl ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">アップロードした画像</h2>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={analysis.imageDataUrl}
                      alt="アップロードされたおたより"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">画像情報</h2>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500">画像データは保存されていません</p>
                    <p className="text-xs text-gray-400 mt-2">
                      テキストデータのみが保存されています
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 右側: 解析結果 */}
            <div className="space-y-6">
              {/* 基本情報 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
                <div className="space-y-3">
                  {extractedData.metadata?.school_name && (
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">学校名:</span>
                      <span className="ml-2 font-medium">{extractedData.metadata.school_name}</span>
                    </div>
                  )}
                  {extractedData.metadata?.issue_date && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">発行日:</span>
                      <span className="ml-2 font-medium">{formatEventDate(extractedData.metadata.issue_date)}</span>
                    </div>
                  )}
                  {extractedData.metadata?.issue_month && (
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">対象月:</span>
                      <span className="ml-2 font-medium">{extractedData.metadata.issue_month}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 概要 */}
              {extractedData.overview && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">概要</h2>
                  <p className="text-gray-700 leading-relaxed">{extractedData.overview}</p>
                </div>
              )}

              {/* 重要なポイント */}
              {extractedData.key_points && extractedData.key_points.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">重要なポイント</h2>
                  <ul className="space-y-2">
                    {extractedData.key_points.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* イベント・TODO */}
              {extractedData.actions && extractedData.actions.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">イベント・TODO</h2>
                  <div className="space-y-4">
                    {extractedData.actions.map((action, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{action.event_name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            action.type === 'event' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {action.type === 'event' ? 'イベント' : 'TODO'}
                          </span>
                        </div>
                        
                        {action.event_date && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            開催日: {formatEventDate(action.event_date)}
                          </div>
                        )}
                        
                        {action.due_date && (
                          <div className="flex items-center text-sm text-red-600 mb-2">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            締切: {formatEventDate(action.due_date)}
                          </div>
                        )}
                        
                        {action.items && action.items.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">必要なもの:</p>
                            <ul className="text-sm text-gray-600 ml-4">
                              {action.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="list-disc">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {action.notes && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">備考:</p>
                            <p className="text-sm text-gray-600">{action.notes}</p>
                          </div>
                        )}
                        
                        {action.confidence && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            <ConfidenceBadge label="日付" confidence={action.confidence.date || 0} />
                            <ConfidenceBadge label="期限" confidence={action.confidence.due || 0} />
                            <ConfidenceBadge label="内容" confidence={action.confidence.items || 0} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 追加情報 */}
              {extractedData.info && extractedData.info.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">追加情報</h2>
                  <ul className="space-y-2">
                    {extractedData.info.map((info, index) => (
                      <li key={index} className="text-gray-700 border-l-4 border-blue-200 pl-4 py-2">
                        {info}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AnalysisDetailPage;

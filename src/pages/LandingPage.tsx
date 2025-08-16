import React from 'react';
import { Link } from 'react-router-dom';
import { UploadIcon, BellIcon, CalendarIcon, CheckCircleIcon, StarIcon } from '@/components/Icon';
import { BRAND, COPY } from '@/constants/brand';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: UploadIcon,
      title: "簡単アップロード",
      description: "スマホで撮影するだけ。おたよりの内容を自動で読み取ります。"
    },
    {
      icon: BellIcon,
      title: "自動リマインド",
      description: "重要な期限を忘れません。家族全員に通知が届きます。"
    },
    {
      icon: CalendarIcon,
      title: "カレンダー連携",
      description: "予定を自動でカレンダーに追加。家族のスケジュールを一元管理。"
    }
  ];

  const plans = [
    {
      name: "無料プラン",
      price: "¥0",
      description: "お試し利用に最適",
      features: [
        "AI解析：月4回まで",
        "保存・履歴：24時間で自動削除",
        "家族と共有：なし",
        "通知・カレンダー：なし",
        "透かし・ぼかし：なし"
      ],
      buttonText: "無料で始める",
      buttonStyle: "bg-gray-100 text-orange-600 hover:bg-gray-200"
    },
    {
      name: "スタンダードプラン",
      price: "¥100",
      period: "/月",
      description: "家族みんなで使える",
      features: [
        "AI解析：月30回まで",
        "保存・履歴：4週間保存",
        "家族と共有：5人まで",
        "SNS通知・カレンダー出力・自動同期",
        "透かし・ぼかし：なし"
      ],
      buttonText: "14日間無料トライアル",
      buttonStyle: "bg-orange-500 text-white hover:bg-orange-600",
      popular: true
    },
    {
      name: "プロプラン",
      price: "¥500",
      period: "/月",
      description: "ヘビーユーザー向け",
      features: [
        "AI解析：月200回まで",
        "保存・履歴：6ヶ月保存",
        "家族と共有：10人まで",
        "SNS通知・カレンダー出力・自動同期",
        "透かし・ぼかし：なし"
      ],
      buttonText: "14日間無料トライアル",
      buttonStyle: "bg-blue-500 text-white hover:bg-blue-600"
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream to-orange-100"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className={`${BRAND.typography.h1} tracking-tight mb-4`}>
              おたより、ポン！<br className="sm:hidden" />
              <span className="block sm:inline-block mt-2 sm:mt-0 text-pon-orange">ですっきり。</span>
            </h1>
            <p className={`${BRAND.typography.body} max-w-2xl mx-auto mb-6 text-gray-600`}>
              学校からの大量のプリント、もうウンザリじゃないですか？<br />
              おたよりポン！が、面倒な予定管理をぜんぶ自動化。家族の笑顔がもっと増える。
            </p>
            <div className="mt-10">
              <img 
                src="/images/landing/landing_top.png" 
                alt="おたよりポン！ - 家族でプリント管理" 
                className="rounded-2xl shadow-2xl mx-auto max-w-lg w-full"
              />
            </div>
            <div className="mt-12">
              <Link
                to="/upload"
                className={`${BRAND.components.button.primary} inline-flex items-center mr-4 transform hover:scale-105 transition-transform`}
              >
                {COPY.cta.analyze}
              </Link>
              <Link
                to="/login"
                className={`${BRAND.components.button.secondary} inline-flex items-center transform hover:scale-105 transition-transform`}
              >
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-12">
              おたよりポン！の特徴
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              料金プラン
            </h2>
            <p className="text-lg text-gray-600">
              あなたのニーズに合わせたプランをお選びください
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-lg shadow-lg p-6 ${plan.popular ? 'ring-2 ring-orange-500 relative' : ''}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-6 transform -translate-y-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500 text-white">
                      <StarIcon className="w-4 h-4 mr-1" />
                      人気
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-gray-500">{plan.period}</span>}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to="/signup"
                  className={`block w-full text-center px-4 py-2 rounded-md font-medium transition-colors ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            今すぐ始めて、家族の時間を取り戻そう
          </h2>
          <p className="text-lg text-orange-100 mb-8">
            面倒な予定管理から解放され、本当に大切な時間を家族と過ごしませんか？
          </p>
          <div className="space-x-4">
            <Link
              to="/signup"
              className="inline-block px-8 py-3 bg-white text-orange-600 font-bold rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            >
              無料アカウント作成
            </Link>
            <Link
              to="/upload"
              className="inline-block px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-orange-600 transition-colors"
            >
              今すぐ試してみる
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

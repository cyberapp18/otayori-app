import React from 'react';

const LegalPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-cream pt-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">特定商取引法に基づく表記</h1>
            <p className="text-gray-600">
              「おたよりポン！」サービスに関する法的事項について
            </p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                販売事業者の名称
              </h2>
              <p className="text-gray-700">
                [事業者名を記載]<br />
                代表者: 大久保佑
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                所在地
              </h2>
              <p className="text-gray-700">
                東京都品川区<br />
                所在地については、お問い合わせフォームよりご請求をいただければ、遅滞なく開示いたします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                連絡先
              </h2>
              <div className="text-gray-700 space-y-2">
                <p><strong>電話番号:</strong> 電話番号については、お問い合わせフォームよりご請求をいただければ、遅滞なく開示いたします。</p>
                <p><strong>メールアドレス:</strong> cyberapp18@gmail.com</p>
                <p><strong>営業時間:</strong> 平日 9:00-18:00（土日祝日を除く）</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                サービスの種類・内容
              </h2>
              <p className="text-gray-700">
                学校・園からのおたより管理AIサービス「おたよりポン！」の提供
              </p>
              <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
                <li>おたより文書のAI解析・要約機能</li>
                <li>重要情報の自動抽出機能</li>
                <li>家族間での情報共有機能</li>
                <li>通知・リマインダー機能</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                料金・支払方法
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">料金プラン</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>無料プラン:</strong> 月額0円（機能制限あり）</li>
                    <li><strong>スタンダードプラン:</strong> 月額100円（税込）</li>
                    <li><strong>プロプラン:</strong> 月額500円（税込）</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">支払方法</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>クレジットカード決済（Stripe経由）</li>
                    <li>対応カード: Visa, Mastercard, JCB, American Express</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">支払時期</h3>
                  <p>毎月自動更新（月額課金）</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                サービス提供時期
              </h2>
              <p className="text-gray-700">
                お申込み確認後、即時サービス利用開始
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                返品・キャンセルについて
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  <strong>クーリングオフについて:</strong><br />
                  本サービスはデジタルコンテンツのため、クーリングオフの対象外となります。
                </p>
                <p>
                  <strong>中途解約について:</strong><br />
                  いつでもアカウント設定からプラン変更・解約が可能です。解約後の返金は行っておりません。
                </p>
                <p>
                  <strong>システム不具合による返金:</strong><br />
                  システムの重大な不具合により長期間サービスを利用できない場合、個別に対応いたします。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                動作環境
              </h2>
              <div className="text-gray-700 space-y-2">
                <p><strong>推奨ブラウザ:</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Google Chrome（最新版）</li>
                  <li>Mozilla Firefox（最新版）</li>
                  <li>Microsoft Edge（最新版）</li>
                  <li>Safari（最新版）</li>
                </ul>
                <p><strong>インターネット環境:</strong> 安定したインターネット接続が必要</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                その他
              </h2>
              <div className="text-gray-700 space-y-2">
                <p>
                  本表記に関してご不明な点がございましたら、上記連絡先までお問い合わせください。
                </p>
                <p>
                  <strong>最終更新日:</strong> 2025年8月17日
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                ご不明な点がございましたら、お気軽にお問い合わせください。
              </p>
              <a 
                href="/contact" 
                className="inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                お問い合わせフォームへ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;

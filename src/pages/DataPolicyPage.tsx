import React from 'react';

const DataPolicyPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] bg-cream pt-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">個人情報の取り扱いについて</h1>
            <p className="text-gray-600">
              「おたよりポン！」における個人情報保護の取り組み
            </p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                基本方針
              </h2>
              <p className="text-gray-700">
                私たちは、利用者様の個人情報を適切に保護することが重要な責務であると認識し、
                個人情報保護法その他関連する法令を遵守するとともに、以下の方針に基づいて
                個人情報を取り扱います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                収集する個人情報
              </h2>
              <div className="text-gray-700 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">アカウント情報</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>メールアドレス</li>
                    <li>ニックネーム（表示名）</li>
                    <li>生年月日</li>
                    <li>居住地域（都道府県・市区町村）</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">サービス利用情報</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>アップロードされた画像・文書</li>
                    <li>AI解析結果・要約データ</li>
                    <li>利用履歴・アクセスログ</li>
                    <li>設定情報・プリファレンス</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">決済情報</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>クレジットカード情報（Stripe社にて管理）</li>
                    <li>決済履歴</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">技術情報</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>IPアドレス</li>
                    <li>ブラウザ情報・デバイス情報</li>
                    <li>Cookie・ローカルストレージ</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                個人情報の利用目的
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>サービスの提供・運営</li>
                <li>ユーザーサポート・お問い合わせ対応</li>
                <li>サービス改善・新機能開発</li>
                <li>利用状況の分析・統計作成</li>
                <li>料金決済・課金管理</li>
                <li>重要なお知らせの配信</li>
                <li>利用規約違反の対応</li>
                <li>法令に基づく義務の履行</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                個人情報の第三者提供
              </h2>
              <div className="text-gray-700 space-y-4">
                <p>
                  以下の場合を除き、個人情報を第三者に提供することはありません。
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>利用者本人の同意がある場合</li>
                  <li>法令に基づく場合</li>
                  <li>人の生命・身体の安全のために必要な場合</li>
                  <li>サービス提供に必要な範囲での委託先への提供</li>
                </ul>
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <h4 className="font-semibold text-blue-900 mb-2">委託先について</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Google Cloud Platform（データ処理・保存）</li>
                    <li>• Firebase（認証・データベース）</li>
                    <li>• Stripe（決済処理）</li>
                    <li>• Google AI（文書解析）</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                個人情報の保護措置
              </h2>
              <div className="text-gray-700 space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">技術的安全管理措置</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>SSL/TLS暗号化通信</li>
                    <li>データベースの暗号化</li>
                    <li>アクセス制御・認証システム</li>
                    <li>定期的なセキュリティ監査</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">組織的安全管理措置</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>個人情報保護管理者の設置</li>
                    <li>従業員への教育・研修</li>
                    <li>アクセス権限の管理</li>
                    <li>委託先の監督</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                個人情報の保存期間
              </h2>
              <div className="text-gray-700 space-y-2">
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>アカウント情報:</strong> アカウント削除まで</li>
                  <li><strong>アップロードデータ:</strong> ユーザーが削除するまで</li>
                  <li><strong>利用履歴:</strong> 最大2年間</li>
                  <li><strong>決済情報:</strong> 法令に基づく保存期間</li>
                </ul>
                <p className="mt-3 text-sm">
                  アカウント削除後は、法令で保存が義務付けられている情報を除き、
                  30日以内にすべてのデータを削除いたします。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                利用者の権利
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>利用者様は、個人情報について以下の権利を有します。</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>開示請求権（保存している個人情報の確認）</li>
                  <li>訂正・追加・削除請求権</li>
                  <li>利用停止・消去請求権</li>
                  <li>第三者提供の停止請求権</li>
                </ul>
                <div className="bg-orange-50 p-4 rounded-lg mt-4">
                  <h4 className="font-semibold text-orange-900 mb-2">お手続きについて</h4>
                  <p className="text-sm text-orange-800">
                    上記の権利を行使される場合は、アカウント設定ページまたは
                    <a href="/contact" className="underline hover:no-underline">お問い合わせフォーム</a>
                    からご連絡ください。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Cookie・類似技術について
              </h2>
              <div className="text-gray-700 space-y-3">
                <p>
                  サービス向上のため、Cookie及び類似の技術を使用しています。
                </p>
                <div>
                  <h3 className="font-semibold mb-2">使用目的</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>ログイン状態の維持</li>
                    <li>利用者設定の保存</li>
                    <li>サービス利用状況の分析</li>
                    <li>セキュリティの向上</li>
                  </ul>
                </div>
                <p className="text-sm">
                  ブラウザ設定によりCookieを無効にすることも可能ですが、
                  一部機能が制限される場合があります。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                改訂について
              </h2>
              <p className="text-gray-700">
                本方針は、関連する法令の改正やサービスの変更等に伴い、
                適宜見直しを行う場合があります。重要な変更については、
                サービス内通知またはメールにてお知らせいたします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                お問い合わせ先
              </h2>
              <div className="text-gray-700">
                <p className="mb-2">個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>個人情報保護管理者:</strong> [管理者名]</p>
                  <p><strong>メール:</strong> [メールアドレス]</p>
                  <p><strong>受付時間:</strong> 平日 9:00-18:00</p>
                </div>
                <p className="mt-3 text-sm">
                  <strong>最終更新日:</strong> 2025年8月17日
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                個人情報に関するご質問やご要望がございましたら、お気軽にお問い合わせください。
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

export default DataPolicyPage;


import React from 'react';

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-b-2 border-orange-200 pb-2">{children}</h2>
);

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-xl font-bold text-gray-700 mt-6 mb-3">{children}</h3>
);

const Paragraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-gray-600 leading-relaxed mb-4">{children}</p>
);

const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">プライバシーポリシー</h1>

            <Paragraph>
                「おたよりポン！」（以下、「本サービス」といいます。）は、ユーザーの個人情報保護の重要性について認識し、個人情報の保護に関する法律（以下、「個人情報保護法」といいます。）を遵守すると共に、以下のプライバシーポリシー（以下、「本ポリシー」といいます。）に従い、適切な取扱い及び保護に努めます。
            </Paragraph>

            <Heading>1. 取得する情報</Heading>
            <Paragraph>
                当社は、本サービスの提供にあたり、以下の情報を取得します。
            </Paragraph>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><b>ユーザー登録情報:</b> ユーザー名、メールアドレス、パスワード等、利用登録のためにご提供いただく情報。</li>
                <li><b>アップロードされるコンテンツ:</b> ユーザーがアップロードするおたよりの画像データ、及び当該画像からOCR（光学的文字認識）技術を用いて抽出されるテキストデータ。</li>
                <li><b>利用状況に関する情報:</b> Cookie、アクセスログ、端末情報、OS情報など、ユーザーのサービス利用状況に関する情報。</li>
            </ul>

            <Heading>2. 情報の利用目的</Heading>
            <Paragraph>
                当社は、取得した情報を以下の目的で利用します。
            </Paragraph>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>本サービスの提供、維持、保護及び改善のため（予定やTODOの自動生成など）。</li>
                <li>ユーザーへのお知らせや連絡、お問い合わせへの対応のため。</li>
                <li>利用規約に違反する行為への対応のため。</li>
                <li>本サービスに関する当社の規約、ポリシー等（以下「規約等」といいます。）の変更などを通知するため。</li>
            </ul>

            <Heading>3. 画像データの取り扱いについて</Heading>
            <Paragraph>
                本サービスでは、ユーザーのプライバシーを尊重し、画像データの取り扱いについて選択肢を提供しています。
            </Paragraph>
            <SubHeading>画像の保持が「OFF」（デフォルト設定）の場合</SubHeading>
            <Paragraph>
                アップロードされた画像データは、テキスト情報を抽出し、要約やTODOリストを生成するために一時的に利用されます。処理完了後、画像データは速やかに破棄され、当社のサーバーには保存されません。
            </Paragraph>
            <SubHeading>画像の保持が「ON」の場合</SubHeading>
            <Paragraph>
                ユーザーが設定画面で画像の保持を「ON」にした場合、アップロードされた画像データは、後から内容を確認する利便性のために、暗号化等の適切なセキュリティ対策を講じた上で、当社のサーバーに安全に保管されます。保管された画像は、ユーザー本人のアカウントからのみアクセス可能です。
            </Paragraph>
            
            <Heading>4. 第三者提供</Heading>
            <Paragraph>
                当社は、法令に基づく場合を除き、あらかじめユーザーの同意を得ることなく、個人情報を第三者に提供しません。
            </Paragraph>

            <Heading>5. 安全管理措置</Heading>
            <Paragraph>
                当社は、個人情報の漏えい、滅失またはき損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
            </Paragraph>

            <Heading>6. 個人情報の開示、訂正等</Heading>
            <Paragraph>
                当社は、ユーザーから、個人情報保護法の定めに基づき個人情報の開示、訂正、追加、削除、利用停止を求められたときは、ユーザーご本人からのご請求であることを確認の上で、遅滞なく対応します。
            </Paragraph>

            <Heading>7. プライバシーポリシーの変更</Heading>
            <Paragraph>
                当社は、必要に応じて、本ポリシーを変更します。変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
            </Paragraph>

            <Heading>8. お問い合わせ</Heading>
            <Paragraph>
                本ポリシーに関するご意見、ご質問、その他利用者情報の取扱いに関するお問い合わせは、以下の窓口までお願いいたします。（この窓口はダミーです）
            </Paragraph>
            <p className="text-gray-700 font-medium">support@otayoripon-demo.app</p>
            
            <div className="mt-8 text-sm text-gray-500">
                <p>以上</p>
                <p>制定日: 2024年7月29日</p>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;

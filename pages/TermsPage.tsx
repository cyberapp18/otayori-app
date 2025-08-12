
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

const TermsPage: React.FC = () => {
    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">利用規約</h1>

            <Paragraph>
                この利用規約（以下、「本規約」といいます。）は、「おたよりポン！」（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
            </Paragraph>

            <Heading>第1条（適用）</Heading>
            <Paragraph>
                本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。
            </Paragraph>

            <Heading>第2条（利用登録）</Heading>
            <Paragraph>
                本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
            </Paragraph>

            <Heading>第3条（ユーザーIDおよびパスワードの管理）</Heading>
            <Paragraph>
                1. ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
            </Paragraph>
            <Paragraph>
                2. ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。
            </Paragraph>

            <Heading>第4条（禁止事項）</Heading>
            <Paragraph>
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
            </Paragraph>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
            </ul>

            <Heading>第5条（本サービスの提供の停止等）</Heading>
            <Paragraph>
                当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            </Paragraph>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
            </ul>

            <Heading>第6条（著作権）</Heading>
            <Paragraph>
                ユーザーが本サービスを利用して投稿その他送信した文章、画像、映像等の著作権については、当該ユーザーその他既存の権利者に留保されるものとします。ただし、当社は、本サービスの提供・改善・プロモーションに必要な範囲でこれらを使用できるものとし、ユーザーはこれに同意するものとします。
            </Paragraph>

            <Heading>第7条（免責事項）</Heading>
            <Paragraph>
                1. 当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
            </Paragraph>
            <Paragraph>
                2. 当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
            </Paragraph>

            <Heading>第8条（利用規約の変更）</Heading>
            <Paragraph>
                当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
            </Paragraph>
            
            <Heading>第9条（準拠法・裁判管轄）</Heading>
            <Paragraph>
                1. 本規約の解釈にあたっては、日本法を準拠法とします。
            </Paragraph>
            <Paragraph>
                2. 本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
            </Paragraph>
            
            <div className="mt-8 text-sm text-gray-500">
                <p>以上</p>
                <p>制定日: 2024年7月29日</p>
            </div>
        </div>
    );
};

export default TermsPage;

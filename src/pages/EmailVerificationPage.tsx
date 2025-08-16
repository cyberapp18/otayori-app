
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@/components/Icon';

const EmailVerificationPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-2xl shadow-lg">
        <div>
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
                ありがとうございます！
            </h1>
            <p className="mt-2 text-gray-600">
                アカウントの作成が完了しました。
            </p>
            <p className="mt-4 text-gray-600">
                本番のアプリケーションでは、ご登録のメールアドレスに確認メールを送信します。
                このデモでは、そのままログインページへお進みください。
            </p>
        </div>
        <div className="mt-6">
          <Link
            to="/login"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            ログインページへ進む
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;

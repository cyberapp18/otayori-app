
import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="text-center py-16 md:py-24">
      <h1 className="text-4xl md:text-6xl font-extrabold text-orange-600 tracking-tight">
        おたよりを撮ったら、<br className="sm:hidden" />
        <span className="block sm:inline-block mt-2 sm:mt-0">やることポン！</span>
      </h1>
      <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-600">
        学校からの大量のプリント、もうウンザリじゃないですか？
        おたよりポン！が、面倒な予定管理をぜんぶ自動化。家族の笑顔がもっと増える。
      </p>
      <div className="mt-10">
        <img 
          src="https://images.unsplash.com/photo-1583912267683-19d239441166?q=80&w=1600&auto=format&fit=crop" 
          alt="Happy family looking at a phone" 
          className="rounded-2xl shadow-2xl mx-auto max-w-lg w-full"
        />
      </div>
      <div className="mt-12">
        <Link
          to="/signup"
          className="inline-block px-10 py-4 bg-orange-500 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-105"
        >
          無料で始める
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          すでにアカウントをお持ちですか？ <Link to="/login" className="text-orange-600 font-medium hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  );
};

export default LandingPage;

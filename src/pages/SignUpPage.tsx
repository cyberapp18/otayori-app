
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/EnhancedAppContext';
import Button from '@/components/Button';
import { User } from '@/types';
import { countries, japanPrefectures } from '@/constants/locations';
import { sanitize } from '@/services/sanitization';

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'JP',
    location: '',
  });

  const [birthdate, setBirthdate] = useState({ year: '', month: '', day: '' });
  const [daysInMonth, setDaysInMonth] = useState<number[]>([]);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAppContext();
  const navigate = useNavigate();
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    if (birthdate.year && birthdate.month) {
        const yearNum = parseInt(birthdate.year, 10);
        const monthNum = parseInt(birthdate.month, 10);
        const days = new Date(yearNum, monthNum, 0).getDate();
        const newDaysArray = Array.from({ length: days }, (_, i) => i + 1);
        setDaysInMonth(newDaysArray);

        if (parseInt(birthdate.day, 10) > days) {
            setBirthdate(prev => ({ ...prev, day: '' }));
        }
    } else {
        setDaysInMonth(Array.from({ length: 31 }, (_, i) => i + 1));
    }
  }, [birthdate.year, birthdate.month, birthdate.day]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleBirthdateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBirthdate({ ...birthdate, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData({ ...formData, country: e.target.value, location: '' });
  }

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
        return { isValid: false, message: 'パスワードは8文字以上で設定してください。' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'パスワードにはアルファベット大文字を最低1文字含めてください。' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'パスワードにはアルファベット小文字を最低1文字含めてください。' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'パスワードには数字を最低1文字含めてください。' };
    }
    return { isValid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
        setError(passwordValidation.message);
        return;
    }
    
    if (!agreedToTerms) {
      setError('利用規約とプライバシーポリシーに同意してください。');
      return;
    }
    
    const { year, month, day } = birthdate;
    if (!year || !month || !day) {
        setError('生年月日を正しく入力してください。');
        return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const { password, confirmPassword, ...otherData } = formData;
      
      const formattedBirthdate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      const sanitizedUser: User = {
        ...otherData,
        username: sanitize(otherData.username),
        email: sanitize(otherData.email),
        location: sanitize(otherData.location),
        birthdate: formattedBirthdate,
      };

      await signup(sanitizedUser, password);
      navigate('/verify-email');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-orange-600">
            アカウントを作成
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            必要な情報を入力してください
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
                <input id="username" name="username" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="例：おたより花子" value={formData.username} onChange={handleChange} />
                <p className="mt-1 text-xs text-gray-500 px-1">アプリ内で表示される名前です。好きなニックネームを自由に設定してください。</p>
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input id="email" name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="email@example.com" value={formData.email} onChange={handleChange} />
            </div>
             <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
                <input id="password" name="password" type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="8文字以上、大小英数字を含む" value={formData.password} onChange={handleChange} />
            </div>
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">パスワードの確認</label>
                <input id="confirmPassword" name="confirmPassword" type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="もう一度パスワードを入力" value={formData.confirmPassword} onChange={handleChange} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
                 <div className="grid grid-cols-3 gap-2">
                    <select name="year" required value={birthdate.year} onChange={handleBirthdateChange} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                        <option value="">年</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select name="month" required value={birthdate.month} onChange={handleBirthdateChange} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                        <option value="">月</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select name="day" required value={birthdate.day} onChange={handleBirthdateChange} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                        <option value="">日</option>
                        {daysInMonth.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">国</label>
                <select id="country" name="country" value={formData.country} onChange={handleCountryChange} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                  {countries.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">{formData.country === 'JP' ? '都道府県' : '地域'}</label>
                {formData.country === 'JP' ? (
                  <select id="location" name="location" required value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-orange-500 focus:border-orange-500">
                    <option value="">都道府県を選択</option>
                    {japanPrefectures.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <input id="location" name="location" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="国/地域" value={formData.location} onChange={handleChange} />
                )}
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-500">
                  <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-orange-600 hover:text-orange-500">
                    利用規約
                  </Link>
                  と
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-orange-600 hover:text-orange-500">
                    プライバシーポリシー
                  </Link>
                  に同意します。
                </label>
              </div>
            </div>
          </div>

          <div>
            <Button type="submit" isLoading={isLoading} disabled={!agreedToTerms || isLoading}>
              無料で登録する
            </Button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600">
          すでにアカウントをお持ちですか？{' '}
          <Link to="/login" className="font-medium text-orange-600 hover:text-orange-500">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;

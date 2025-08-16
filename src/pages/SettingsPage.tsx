
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '@/EnhancedAppContext';
import { Child } from '@/types';
import Button from '@/components/Button';
import { PencilIcon, TrashIcon } from '@/components/Icon';
import { sanitize } from '@/services/sanitization';
import * as familyService from '@/services/familyService';

const SettingSection: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({ title, description, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    {description && <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>}
    <div className="space-y-4">{children}</div>
  </div>
);

const Toggle: React.FC<{ label: string; description: string; enabled: boolean; onToggle: () => void }> = ({ label, description, enabled, onToggle }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium text-gray-800">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-orange-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const ChildEditor: React.FC<{ child: Child | null; onSave: (id: string | null, name: string, age: number) => void; onCancel: () => void; }> = ({ child, onSave, onCancel }) => {
  const [name, setName] = useState(child ? child.name : '');
  const [age, setAge] = useState(child ? String(child.age) : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && age) {
      onSave(child ? child.id : null, sanitize(name), parseInt(age, 10));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-orange-50 rounded-lg space-y-4">
      <h3 className="font-bold text-lg text-gray-800">{child ? 'お子さま情報の編集' : 'お子さまの追加'}</h3>
      <div>
        <label htmlFor="childName" className="block text-sm font-medium text-gray-700">ニックネーム</label>
        <input type="text" id="childName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="childAge" className="block text-sm font-medium text-gray-700">年齢</label>
        <input type="number" id="childAge" value={age} onChange={e => setAge(e.target.value)} required min="0" max="20" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">キャンセル</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">保存する</button>
      </div>
    </form>
  );
};

const ChildManager: React.FC = () => {
    const { children, addChild, updateChild, deleteChild, isAuthenticated } = useAppContext();
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    if (!isAuthenticated) {
        return (
           <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-gray-600">この機能を利用するにはログインが必要です。</p>
            <Link to="/login" className="mt-2 inline-block font-medium text-orange-600 hover:underline">ログインページへ</Link>
          </div>
        );
    }
    
    const handleSave = (id: string | null, name: string, age: number) => {
        if (id) { // Editing existing child
            updateChild(id, { name, age });
        } else { // Adding new child
            addChild(name, age);
        }
        setEditingChild(null);
        setIsAdding(false);
    };

    const handleDelete = (childId: string, childName: string) => {
        if (window.confirm(`「${sanitize(childName)}」さんの情報を削除しますか？\n関連するタスクやお知らせからこのお子さまの関連付けも解除されます。`)) {
            deleteChild(childId);
        }
    };

    return (
        <div>
            <div className="space-y-3">
                {children.map(child => (
                    <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-800">{child.name} ({child.age}歳)</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setEditingChild(child)} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><PencilIcon className="w-5 h-5 text-gray-500" /></button>
                            <button onClick={() => handleDelete(child.id, child.name)} className="p-2 rounded-full hover:bg-red-100 transition-colors"><TrashIcon className="w-5 h-5 text-red-500" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {(isAdding || editingChild) && (
                <div className="mt-4">
                    <ChildEditor child={editingChild} onSave={handleSave} onCancel={() => { setIsAdding(false); setEditingChild(null); }} />
                </div>
            )}
            
            {!isAdding && !editingChild && (
                <div className="mt-4">
                    <Button variant="secondary" onClick={() => setIsAdding(true)}>新しいお子さまを追加</Button>
                </div>
            )}
        </div>
    );
};

const FamilyManager: React.FC = () => {
    const { user, isAuthenticated } = useAppContext();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStatus, setInviteStatus] = useState<{success: boolean, message: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isAuthenticated) {
        return null; // Handled by parent component
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setInviteStatus(null);
        const result = await familyService.inviteFamilyMember(inviteEmail);
        setInviteStatus(result);
        if (result.success) {
            setInviteEmail('');
        }
        setIsLoading(false);
    };

    return (
        <div>
            <div className="mb-4">
                <h3 className="font-semibold text-gray-700">現在のメンバー</h3>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    {user?.username} (あなた)
                </div>
            </div>
            <div>
                 <h3 className="font-semibold text-gray-700">家族を招待する</h3>
                 <form onSubmit={handleInvite} className="mt-2 flex flex-col sm:flex-row gap-2">
                     <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="招待する方のメールアドレス" required className="flex-grow border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                     <Button type="submit" isLoading={isLoading} disabled={isLoading}>招待する</Button>
                 </form>
                 {inviteStatus && (
                     <p className={`mt-2 text-sm ${inviteStatus.success ? 'text-green-600' : 'text-red-600'}`}>{inviteStatus.message}</p>
                 )}
            </div>
        </div>
    );
}

const SettingsPage: React.FC = () => {
  const { isAuthenticated, imageRetention, toggleImageRetention } = useAppContext();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">設定</h1>
      
      <SettingSection title="お子さまの管理" description="おたよりを整理するために、お子さまの情報を登録します。">
        <ChildManager />
      </SettingSection>

      <SettingSection title="家族の管理" description="家族を招待して、おたよりやTODOを共有しましょう。">
         {isAuthenticated ? <FamilyManager /> : (
             <div className="p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-gray-600">この機能を利用するにはログインが必要です。</p>
                <Link to="/login" className="mt-2 inline-block font-medium text-orange-600 hover:underline">ログインページへ</Link>
            </div>
         )}
      </SettingSection>

      <SettingSection title="プライバシー">
        <Toggle
          label="画像の保持"
          description="OFFの場合、解析後すぐにおたより画像は破棄されます"
          enabled={imageRetention}
          onToggle={toggleImageRetention}
        />
        <p className="text-xs text-gray-500">
            {imageRetention 
             ? "ON: アップロードされた画像は安全に保管され、後から確認できます。"
             : "OFF: テキスト抽出後、画像はサーバーに残らず即時破棄されるため安心です。"
            }
        </p>
      </SettingSection>

      <SettingSection title="その他">
        <Link to="/terms" className="block w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">利用規約</Link>
        <Link to="/privacy" className="block w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">プライバシーポリシー</Link>
      </SettingSection>

    </div>
  );
};

export default SettingsPage;

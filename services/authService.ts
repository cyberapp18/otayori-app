import { User } from '../types';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // 追加
import { getApp } from 'firebase/app';

// Firebase Authインスタンスを取得
const auth = getAuth(getApp());
// Firestoreインスタンスを取得
const db = getFirestore(getApp()); // 追加

export const signup = async (user: User, password: string): Promise<void> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
    const firebaseUser = userCredential.user;

    // Firestoreにユーザープロフィールを保存
    // `uid`をドキュメントIDとして使用し、`User`型から`uid`を除いたデータを保存
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      username: user.username,
      email: user.email,
      birthdate: user.birthdate,
      country: user.country,
      location: user.location,
      createdAt: new Date().toISOString(), // ユーザー作成日時を追加
    });

    console.log("User signed up successfully and profile saved to Firestore:", firebaseUser.email);
  } catch (error: any) {
    console.error("Error signing up:", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('このメールアドレスは既に使用されています。');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('パスワードは6文字以上である必要があります。');
    }
    throw new Error('サインアップ中にエラーが発生しました。');
  }
};

export const login = async (email: string, password: string): Promise<void> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in successfully:", email);
  } catch (error: any) {
    console.error("Error logging in:", error);
    if (error.code === 'auth/invalid-credential') {
      throw new Error('メールアドレスまたはパスワードが正しくありません。');
    }
    throw new Error('ログイン中にエラーが発生しました。');
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("User logged out successfully.");
  } catch (error) {
    console.error("Error logging out:", error);
    throw new Error('ログアウト中にエラーが発生しました。');
  }
};

export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

export const getCurrentUser = (): User | null => {
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      username: firebaseUser.displayName || firebaseUser.email || '',
      // Firestoreから追加情報を取得する場合は、ここで非同期処理が必要になります
      // 現状ではFirebase AuthのUserオブジェクトから直接マッピングできる情報のみ
      birthdate: '', // 仮の値、Firestoreから取得する必要がある
      country: '',   // 仮の値、Firestoreから取得する必要がある
      location: '',  // 仮の値、Firestoreから取得する必要がある
    };
  }
  return null;
};

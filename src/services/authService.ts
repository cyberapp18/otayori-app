import { User } from '@/types';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

// Firebase Authインスタンスの取得を各関数の内部に移動
// Firestoreインスタンスの取得も各関数の内部に移動

export const signup = async (user: User, password: string): Promise<void> => {
  try {
    const auth = getAuth(getApp()); // 関数が呼び出されたときに取得
    const db = getFirestore(getApp()); // 関数が呼び出されたときに取得

    const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
    const firebaseUser = userCredential.user;

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      username: user.username,
      email: user.email,
      birthdate: user.birthdate,
      country: user.country,
      location: user.location,
      createdAt: new Date().toISOString(),
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
    const auth = getAuth(getApp()); // 関数が呼び出されたときに取得
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
    const auth = getAuth(getApp()); // 関数が呼び出されたときに取得
    await signOut(auth);
    console.log("User logged out successfully.");
  } catch (error) {
    console.error("Error logging out:", error);
    throw new Error('ログアウト中にエラーが発生しました。');
  }
};

// NOTE: これらの関数は同期的に認証状態を返しますが、
// onAuthStateChangedを使用するApp.tsxのロジックを考慮すると、
// 厳密にはこれらの関数はほとんど使われなくなる可能性があります。
// しかし、後方互換性のため残しておきます。
export const isAuthenticated = (): boolean => {
  try {
    const auth = getAuth(getApp()); // 関数が呼び出されたときに取得
    return auth.currentUser !== null;
  } catch (error) {
    // Firebaseアプリがまだ初期化されていない場合など
    console.warn("Firebase App not yet initialized when calling isAuthenticated.", error);
    return false;
  }
};

export const getCurrentUser = (): User | null => {
  try {
    const auth = getAuth(getApp()); // 関数が呼び出されたときに取得
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName || firebaseUser.email || '',
        birthdate: '',
        country: '',
        location: '',
      };
    }
  } catch (error) {
    console.warn("Firebase App not yet initialized when calling getCurrentUser.", error);
  }
  return null;
};

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase設定（本番環境の設定をコピー）
const firebaseConfig = {
  apiKey: "AIzaSyD8Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z",
  authDomain: "otayori-app.firebaseapp.com",
  projectId: "otayori-app",
  storageBucket: "otayori-app.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// テストユーザーデータ
const testUsers = [
  {
    email: 'test1@otayori-app.com',
    password: 'TestPassword123!',
    username: 'テストママ',
    country: 'JP',
    location: '東京都',
    birthdate: '1985-05-15'
  },
  {
    email: 'test2@otayori-app.com',
    password: 'TestPassword123!',
    username: 'テストパパ',
    country: 'JP',
    location: '大阪府',
    birthdate: '1983-12-20'
  },
  {
    email: 'admin@otayori-app.com',
    password: 'AdminPassword123!',
    username: '管理者テスト',
    country: 'JP',
    location: '神奈川県',
    birthdate: '1980-01-01'
  }
];

async function createTestUser(userData) {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    // Firebase Authでユーザー作成
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const user = userCredential.user;
    
    // ユーザープロフィール更新
    await updateProfile(user, {
      displayName: userData.username
    });
    
    // Firestoreにユーザーデータ保存
    await setDoc(doc(db, 'users', user.uid), {
      username: userData.username,
      email: userData.email,
      country: userData.country,
      location: userData.location,
      birthdate: userData.birthdate,
      createdAt: new Date(),
      isTestUser: true, // テストユーザーフラグ
      plan: 'free',
      usageCount: 0,
      maxUsage: 4
    });
    
    console.log(`✅ Successfully created user: ${userData.email} (UID: ${user.uid})`);
    return user;
    
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message);
    return null;
  }
}

async function createAllTestUsers() {
  console.log('🚀 Starting test user creation...\n');
  
  for (const userData of testUsers) {
    await createTestUser(userData);
    console.log(''); // 空行でセパレート
  }
  
  console.log('✨ Test user creation completed!');
  
  console.log('\n📋 Test Account Summary:');
  testUsers.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Username: ${user.username}`);
    console.log('---');
  });
}

// スクリプト実行
createAllTestUsers().catch(console.error);

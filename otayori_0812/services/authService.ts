
import { User } from '../types';

// IMPORTANT: This is a mock authentication service using localStorage.
// This is NOT secure and should NEVER be used in a production environment.
// In a real application, you would use a secure backend service with
// password hashing (e.g., bcrypt), secure session management (e.g., JWTs),
// and a proper database.

const USER_KEY = 'otayori-pon-user';
const TOKEN_KEY = 'otayori-pon-token';

export const signup = async (user: User, password: string): Promise<void> => {
  // In a real app, this would be an API call to your backend.
  const existingUsers = JSON.parse(localStorage.getItem(USER_KEY) || '[]');
  
  if (existingUsers.some((u: {data: User}) => u.data.email === user.email)) {
    throw new Error('このメールアドレスは既に使用されています。');
  }
  
  // Storing password in localStorage is extremely insecure. This is for demo purposes only.
  const newUser = { data: user, password };
  existingUsers.push(newUser);
  
  localStorage.setItem(USER_KEY, JSON.stringify(existingUsers));
};

export const login = async (email: string, password: string): Promise<void> => {
  const existingUsers = JSON.parse(localStorage.getItem(USER_KEY) || '[]');
  const foundUser = existingUsers.find((u: {data: User, password: string}) => u.data.email === email && u.password === password);

  if (!foundUser) {
    throw new Error('メールアドレスまたはパスワードが正しくありません。');
  }
  
  // Create a mock session token
  const token = `mock-token-${Date.now()}`;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('currentUser', JSON.stringify(foundUser.data));
};

export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('currentUser');
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(TOKEN_KEY) !== null;
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    return JSON.parse(userJson);
  }
  return null;
};

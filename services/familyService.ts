import { Child, Family } from '../types';

// IMPORTANT: This is a mock service using localStorage.
// In a real application, this would interact with a backend database.
const FAMILY_KEY = 'otayori_pon_family';
const CHILDREN_KEY = 'otayori_pon_children';

// For this demo, we'll work with a single, hardcoded family.
// A real app would dynamically handle multiple families based on user accounts.
const MOCK_FAMILY: Family = {
    id: 'family-1',
    name: 'デモ家族',
    members: [], // Member management is not fully implemented in this demo
    createdAt: new Date().toISOString(),
};

export const getFamily = (): Family => {
    const familyJson = localStorage.getItem(FAMILY_KEY);
    if (familyJson) {
        return JSON.parse(familyJson);
    }
    // If no family exists, create the mock one.
    localStorage.setItem(FAMILY_KEY, JSON.stringify(MOCK_FAMILY));
    return MOCK_FAMILY;
};

export const getChildren = (): Child[] => {
    const childrenJson = localStorage.getItem(CHILDREN_KEY);
    return childrenJson ? JSON.parse(childrenJson) : [];
};

export const saveChildren = (children: Child[]): void => {
    localStorage.setItem(CHILDREN_KEY, JSON.stringify(children));
};

export const addChild = (name: string, age: number): Child => {
    const children = getChildren();
    const newChild: Child = {
        id: `child-${Date.now()}`,
        familyId: MOCK_FAMILY.id,
        name,
        age,
        createdAt: new Date().toISOString(),
    };
    const updatedChildren = [...children, newChild];
    saveChildren(updatedChildren);
    return newChild;
};

export const updateChild = (childId: string, updates: Partial<Pick<Child, 'name' | 'age'>>): Child | undefined => {
    let updatedChild: Child | undefined;
    const children = getChildren();
    const updatedChildren = children.map(c => {
        if (c.id === childId) {
            updatedChild = { ...c, ...updates };
            return updatedChild;
        }
        return c;
    });
    saveChildren(updatedChildren);
    return updatedChild;
};

export const deleteChild = (childId: string): void => {
    const children = getChildren();
    const updatedChildren = children.filter(c => c.id !== childId);
    saveChildren(updatedChildren);
};

export const inviteFamilyMember = async (email: string): Promise<{ success: boolean; message: string }> => {
    console.log(`(Mock) Invitation sent to: ${email}`);
    // This is a placeholder for a real backend implementation.
    // In a real app, you would send an API request to your backend to handle the invitation logic (e.g., send email, create pending invite).
    if (!email.includes('@')) {
      return { success: false, message: '有効なメールアドレスを入力してください。' };
    }
    
    // Simulate a successful invitation.
    return { success: true, message: `${email} に招待を送信しました。（デモ）` };
  };
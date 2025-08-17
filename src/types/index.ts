// New types for the detailed class newsletter schema
export interface ClassNewsletterHeader {
  title: string | null;
  class_name: string | null;
  school_name: string | null;
  issue_month: string | null; // YYYY-MM
  issue_date: string | null; // YYYY-MM-DD
}

export interface RepeatRule {
  byDay: string[]; // e.g., ["MO", "TU"]
  time: string; // e.g., "07:00"
}

export interface ActionConfidence {
  date: number; // 0-1
  due: number; // 0-1
  items: number; // 0-1
}

export interface NewsletterAction {
  type: 'event' | 'todo';
  event_name: string;
  is_continuation?: boolean; // New: Flag for recurring/continued requests
  event_date: string | null;
  due_date: string | null;
  items: string[];
  fee: string | null;
  repeat_rule: RepeatRule | null;
  audience: string | null;
  importance: 'high' | 'medium' | 'low';
  action_required: true;
  notes: string | null;
  confidence: ActionConfidence;
}

export interface NewsletterInfo {
  title: string;
  summary: string;
  audience: string | null;
}

export interface ClassNewsletterSchema {
  header: ClassNewsletterHeader;
  overview: string;
  key_points: string[];
  actions: NewsletterAction[];
  infos: NewsletterInfo[];
}


export interface Notice {
  id: string;
  familyId: string;
  rawText: string;
  extractJson: ClassNewsletterSchema; // Updated to the new schema
  summary: string; // This will now be populated from extractJson.overview
  createdAt: string;
  seenBy: string[];
  pinned: boolean;
  originalImage?: string | null;
  childIds?: string[]; // New: Associated child IDs
}

export interface Task {
  id: string;
  familyId: string;
  noticeId: string;
  title: string;
  dueAt: string | null;
  assigneeCid: string;
  completed: boolean;
  createdAt: string;
  isContinuation?: boolean;
  repeatRule: RepeatRule | null;
  notes?: string;
  completedBy?: string | null;
  completedAt?: string | null;
  childIds?: string[]; // New: Associated child IDs
}

// 家族管理の型定義

export interface FamilyMember {
  role: 'owner' | 'parent' | 'child';
  name: string;
  joinedAt: string;
  permissions: {
    canInvite: boolean;
    canManageChildren: boolean;
    canViewAll: boolean;
  };
}

export interface FamilyChild {
  name: string;
  grade?: string; // 年齢（数値のみ、例：「6」）
  school?: string; // 学校・園名
  userId?: string | null;
  parentId: string;
  isRegistered: boolean;
  inviteCode?: string | null;
  createdAt: string;
}

export interface FamilyInvite {
  type: 'family' | 'child';
  targetChildId?: string | null;
  invitedBy: string;
  email?: string | null;
  code: string;
  method: 'qr' | 'email' | 'line';
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedBy?: string | null;
  usedAt?: string | null;
}

export interface FamilySettings {
  shareNotices: boolean;
  shareTasks: boolean;
  autoShare: boolean;
}

export interface Family {
  id: string;
  ownerId: string;
  members: { [userId: string]: FamilyMember };
  children: { [childId: string]: FamilyChild };
  invites: { [inviteId: string]: FamilyInvite };
  settings: FamilySettings;
  onboardingStep: number;
  onboardingCompleted: boolean;
  maxMembers: number;
  maxChildren: number;
  createdAt: string;
}

export interface ChildProfile {
  parentId: string;
  childId: string;
  grade?: string;
  school?: string;
}

// 既存のChild型を更新
export interface Child {
  id: string;
  familyId: string;
  name: string;
  age: number;
  createdAt: string;
}

export interface User {
  uid: string; // 追加: Firebase AuthのUID
  username: string;
  email: string;
  birthdate: string;
  country: string;
  location: string;
}
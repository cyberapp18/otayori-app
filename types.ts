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

export interface Child {
  id: string;
  familyId: string;
  name: string;
  age: number;
  createdAt: string;
}

export interface Family {
    id: string;
    name: string;
    members: string[]; // This would hold user IDs
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
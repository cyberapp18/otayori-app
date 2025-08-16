// Firestore用の型定義
export interface Customer {
  email: string;
  stripeId: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  currentPlan: 'free' | 'standard' | 'pro';
  planStatus: 'active' | 'trialing' | 'past_due' | 'canceled';
  monthlyUsage: number;
  lastUsageReset: Date;
  familyId?: string;
  familyRole: 'owner' | 'member';
  settings: {
    notifications: {
      email: boolean;
      push: boolean;
    };
    autoShare: boolean;
  };
}

export interface Family {
  name: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  maxMembers: number;
  pendingInvites: {
    [email: string]: {
      invitedBy: string;
      createdAt: Date;
      expiresAt: Date;
    };
  };
}

export interface Notice {
  userId: string;
  familyId?: string;
  title: string;
  extractedText: string;
  imageUrl: string;
  aiData: {
    eventDate?: string;
    deadline?: string;
    confidence: number;
  };
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
  expiresAt?: Date;
  planAtCreation: string;
}

export interface Task {
  noticeId: string;
  userId: string;
  familyId?: string;
  title: string;
  dueDate?: Date;
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export interface StripeProduct {
  id: string;
  active: boolean;
  name: string;
  description: string;
  metadata: {
    name: string;
    planType: 'standard' | 'pro';
  };
}

export interface StripePrice {
  id: string;
  productId: string;
  active: boolean;
  currency: string;
  unitAmount: number;
  recurring: {
    interval: 'month' | 'year';
    intervalCount: number;
  };
}

export interface PlanInfo {
  productId: string;
  priceId: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  planType: 'free' | 'standard' | 'pro';
  features: string[];
}

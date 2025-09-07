import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { ClassNewsletterSchema } from '../types';
import { UserService } from './userService';

export interface AnalysisRecord {
  id?: string;
  userId: string;
  originalText: string;
  extractedData: ClassNewsletterSchema;
  imageDataUrl?: string;
  selectedChildIds: string[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  tags?: string[];
}

export interface TodoItem {
  id?: string;
  userId: string;
  analysisId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  assignedTo?: string; // 実施担当者のユーザーID
  assignedToName?: string; // 実施担当者の表示名
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationItem {
  id?: string;
  userId: string;
  analysisId: string;
  title: string;
  message: string;
  type: 'deadline' | 'event' | 'reminder' | 'info';
  isRead: boolean;
  scheduledFor?: Date;
  createdAt: Date;
}

export class AnalysisService {

  /**
   * ユーザーのTODOを追加
   */
  static async addUserTodo(userId: string, todo: Omit<TodoItem, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'todos'), {
        ...todo,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding todo:', error);
      throw new Error('タスクの追加に失敗しました');
    }
  }

  /**
   * ユーザーのTODOを削除
   */
  static async deleteTodo(todoId: string): Promise<void> {
    try {
      const todoDoc = doc(db, 'todos', todoId);
      await deleteDoc(todoDoc);
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw new Error('タスクの削除に失敗しました');
    }
  }

  /**
   * TODOを更新
   */
  static async updateTodo(todoId: string, updates: Partial<TodoItem>): Promise<void> {
    try {
      const todoDoc = doc(db, 'todos', todoId);
      await updateDoc(todoDoc, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating todo:', error);
      throw new Error('タスクの更新に失敗しました');
    }
  }
  /**
   * 解析結果を保存
   */
  static async saveAnalysis(
    userId: string,
    originalText: string,
    extractedData: ClassNewsletterSchema,
    selectedChildIds: string[] = [],
    imageDataUrl?: string
  ): Promise<string> {
    try {
      // プラン制限チェックと古いデータ削除
      await this.validateAndCleanupBeforeAdd(userId);

      console.log('Saving analysis for user:', userId);
      console.log('Extracted data:', extractedData);

      const analysisRecord: Omit<AnalysisRecord, 'id'> = {
        userId,
        originalText,
        extractedData,
        selectedChildIds,
        imageDataUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
        tags: []
      };

      console.log('Creating analysis document...');
      const docRef = await addDoc(collection(db, 'analyses'), {
        ...analysisRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Analysis document created with ID:', docRef.id);

      // TODOアイテムとして保存（エラーがあっても続行）
      try {
        await this.extractAndSaveTodos(userId, docRef.id, extractedData);
        console.log('TODOs saved successfully');
      } catch (todoError) {
        console.warn('Error saving TODOs (continuing):', todoError);
      }

      // 通知を生成（エラーがあっても続行）
      try {
        await this.generateNotifications(userId, docRef.id, extractedData);
        console.log('Notifications generated successfully');
      } catch (notificationError) {
        console.warn('Error generating notifications (continuing):', notificationError);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error saving analysis:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error(`解析結果の保存に失敗しました: ${error.message}`);
    }
  }

  /**
   * ユーザーの解析結果一覧を取得
   */
  static async getUserAnalyses(userId: string, limitCount: number = 20): Promise<AnalysisRecord[]> {
    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as AnalysisRecord[];
    } catch (error) {
      console.error('Error fetching user analyses:', error);
      throw new Error('解析結果の取得に失敗しました');
    }
  }

  /**
   * 抽出データからTODOアイテムを作成
   */
  static async extractAndSaveTodos(
    userId: string, 
    analysisId: string, 
    extractedData: ClassNewsletterSchema
  ): Promise<void> {
    try {
      console.log('Extracting TODOs from:', extractedData);
      const todos: Omit<TodoItem, 'id'>[] = [];

      // actionsが存在し、配列の場合のみ処理
      if (extractedData.actions && Array.isArray(extractedData.actions)) {
        extractedData.actions.forEach((action, index) => {
          try {
            if (action && (action.type === 'todo' || action.due_date)) {
              const dueDate = action.due_date ? new Date(action.due_date) : undefined;
              
              // 日付が有効かチェック
              if (dueDate && isNaN(dueDate.getTime())) {
                console.warn(`Invalid date for action ${index}:`, action.due_date);
                return; // この要素はスキップ
              }

              todos.push({
                userId,
                analysisId,
                title: action.event_name || '未定のタスク',
                description: action.notes || undefined,
                dueDate,
                priority: action.importance === 'high' ? 'high' : 
                         action.importance === 'low' ? 'low' : 'medium',
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          } catch (actionError) {
            console.warn(`Error processing action ${index}:`, actionError);
          }
        });
      }

      console.log(`Found ${todos.length} TODOs to save`);

      // TODOsを個別に保存
      for (const [index, todo] of todos.entries()) {
        try {
          await addDoc(collection(db, 'todos'), {
            ...todo,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log(`TODO ${index + 1} saved successfully`);
        } catch (todoSaveError) {
          console.warn(`Error saving TODO ${index + 1}:`, todoSaveError);
        }
      }
    } catch (error) {
      console.error('Error in extractAndSaveTodos:', error);
      throw error;
    }
  }

  /**
   * 通知を生成
   */
  static async generateNotifications(
    userId: string, 
    analysisId: string, 
    extractedData: ClassNewsletterSchema
  ): Promise<void> {
    try {
      const notifications: Omit<NotificationItem, 'id'>[] = [];

      // アクションから期限付きの通知を生成
      extractedData.actions?.forEach(action => {
        if (action.due_date) {
          const dueDate = new Date(action.due_date);
          const now = new Date();
          
          // 期限の3日前に通知
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - 3);
          
          if (reminderDate > now) {
            notifications.push({
              userId,
              analysisId,
              title: '期限のリマインダー',
              message: `${action.event_name}の期限が近づいています（期限: ${action.due_date}）`,
              type: 'deadline',
              isRead: false,
              scheduledFor: reminderDate,
              createdAt: new Date()
            });
          }

          // 期限当日の通知
          if (dueDate > now) {
            notifications.push({
              userId,
              analysisId,
              title: '期限です！',
              message: `${action.event_name}の期限日です`,
              type: 'deadline',
              isRead: false,
              scheduledFor: dueDate,
              createdAt: new Date()
            });
          }
        }

        // イベントの前日通知
        if (action.type === 'event' && action.event_date) {
          const eventDate = new Date(action.event_date);
          const reminderDate = new Date(eventDate);
          reminderDate.setDate(reminderDate.getDate() - 1);
          const now = new Date();

          if (reminderDate > now) {
            notifications.push({
              userId,
              analysisId,
              title: 'イベントのお知らせ',
              message: `明日は${action.event_name}です`,
              type: 'event',
              isRead: false,
              scheduledFor: reminderDate,
              createdAt: new Date()
            });
          }
        }
      });

      // 通知を個別に保存
      for (const notification of notifications) {
        await addDoc(collection(db, 'notifications'), {
          ...notification,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
    }
  }

  /**
   * ユーザーのTODOリストを取得
   */
  static async getUserTodos(userId: string, includeCompleted: boolean = false): Promise<TodoItem[]> {
    try {
      let q = query(
        collection(db, 'todos'),
        where('userId', '==', userId),
        orderBy('dueDate', 'asc')
      );

      if (!includeCompleted) {
        q = query(
          collection(db, 'todos'),
          where('userId', '==', userId),
          where('completed', '==', false),
          orderBy('dueDate', 'asc')
        );
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || undefined,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TodoItem[];
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw new Error('TODOリストの取得に失敗しました');
    }
  }

  /**
   * TODOの完了状態を切り替え
   */
  static async toggleTodoCompletion(todoId: string): Promise<void> {
    try {
      const todoDoc = doc(db, 'todos', todoId);
      await updateDoc(todoDoc, {
        completed: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating todo:', error);
      throw new Error('TODOの更新に失敗しました');
    }
  }

  /**
   * ユーザーの通知を取得
   */
  static async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<NotificationItem[]> {
    try {
      let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (unreadOnly) {
        q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('isRead', '==', false),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledFor: doc.data().scheduledFor?.toDate() || undefined,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as NotificationItem[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('通知の取得に失敗しました');
    }
  }

  /**
   * 通知を既読にする
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationDoc = doc(db, 'notifications', notificationId);
      await updateDoc(notificationDoc, {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('通知の既読処理に失敗しました');
    }
  }

  /**
   * プラン制限チェック - 月間利用回数
   */
  static async checkMonthlyUsageLimit(userId: string): Promise<{ canUse: boolean; remainingUsage: number }> {
    try {
      const userProfile = await UserService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('ユーザープロフィールが見つかりません');
      }

      const remainingUsage = userProfile.monthlyLimit - userProfile.currentMonthUsage;
      return {
        canUse: remainingUsage > 0,
        remainingUsage: Math.max(0, remainingUsage)
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      throw new Error('利用制限の確認に失敗しました');
    }
  }

  /**
   * プラン制限に基づくデータ自動削除
   */
  static async cleanupOldDataByPlan(userId: string): Promise<void> {
    try {
      const userProfile = await UserService.getUserProfile(userId);
      if (!userProfile) return;

      const now = new Date();
      let cutoffDate: Date;

      // プランに基づく保存期間設定
      switch (userProfile.planType) {
        case 'free':
          // 24時間前
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'standard':
          // 4週間前（28日）
          cutoffDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
          break;
        case 'pro':
          // 6ヶ月前（180日）
          cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        default:
          // デフォルトは無料プラン
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // 古い解析結果を削除
      const analysisQuery = query(
        collection(db, 'analyses'),
        where('userId', '==', userId),
        where('createdAt', '<', cutoffDate)
      );
      const analysisSnapshot = await getDocs(analysisQuery);
      
      // 古いTODOを削除
      const todoQuery = query(
        collection(db, 'todos'),
        where('userId', '==', userId),
        where('createdAt', '<', cutoffDate)
      );
      const todoSnapshot = await getDocs(todoQuery);

      // 古い通知を削除
      const notificationQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('createdAt', '<', cutoffDate)
      );
      const notificationSnapshot = await getDocs(notificationQuery);

      // バッチ削除実行
      const deletePromises: Promise<void>[] = [];
      
      analysisSnapshot.docs.forEach(docSnapshot => {
        deletePromises.push(deleteDoc(docSnapshot.ref));
      });
      
      todoSnapshot.docs.forEach(docSnapshot => {
        deletePromises.push(deleteDoc(docSnapshot.ref));
      });
      
      notificationSnapshot.docs.forEach(docSnapshot => {
        deletePromises.push(deleteDoc(docSnapshot.ref));
      });

      await Promise.all(deletePromises);

      console.log(`Cleaned up old data for user ${userId}. Plan: ${userProfile.planType}, Cutoff: ${cutoffDate}`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      // エラーが発生してもアプリケーションの動作を止めない
    }
  }

  /**
   * データ追加前の制限チェックと古いデータの削除
   */
  static async validateAndCleanupBeforeAdd(userId: string): Promise<void> {
    // 月間利用制限チェック
    const { canUse } = await this.checkMonthlyUsageLimit(userId);
    if (!canUse) {
      throw new Error('今月の利用上限に達しています。プランをアップグレードするか、来月まで待ってください。');
    }

    // 古いデータを削除
    await this.cleanupOldDataByPlan(userId);
  }
}

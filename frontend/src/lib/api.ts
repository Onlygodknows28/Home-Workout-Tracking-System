const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Deduplicate concurrent identical GET requests in-flight
const inFlightGetRequests = new Map<string, Promise<any>>();

export interface AiChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('fit_token');
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const token = this.getToken();
    const dedupeKey = method === 'GET' ? `${token || 'anon'}:${endpoint}` : null;

    if (dedupeKey && inFlightGetRequests.has(dedupeKey)) {
      return inFlightGetRequests.get(dedupeKey) as Promise<T>;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const executeFetch = (async () => {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.message || `Lỗi yêu cầu (${res.status})`;
        throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      }

      return data as T;
    })();

    if (dedupeKey) {
      inFlightGetRequests.set(dedupeKey, executeFetch);
      executeFetch
        .finally(() => {
          inFlightGetRequests.delete(dedupeKey);
        })
        .catch(() => {});
    }

    return executeFetch;
  }

  // Auth
  static async register(body: any) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async login(body: any) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async googleAuth(credential: string) {
    return this.request<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  }

  // User & Profile
  static async getProfile() {
    return this.request<any>('/users/me');
  }

  static async submitOnboarding(body: any) {
    return this.request<any>('/users/onboarding', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async updateProfile(body: {
    name?: string;
    avatar?: string;
    height?: number;
    weight?: number;
    primaryGoal?: string;
    injuries?: string[];
    availableEquipment?: string[];
  }) {
    return this.request<any>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // AI Recommendation & Hybrid LLM Coach
  static async getDailyRecommendation() {
    return this.request<any>('/recommendations/daily');
  }

  static async getAuxiliaryRecommendation() {
    return this.request<any>('/recommendations/auxiliary');
  }

  static async configureGeminiKey(apiKey?: string) {
    return this.request<{
      valid: boolean;
      engine: 'GEMINI_2_5_FLASH' | 'HYBRID_EXPERT_ENGINE';
      model: string | null;
      message: string;
    }>('/recommendations/config-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  static async sendAiChatMessage(body: {
    message: string;
    history?: AiChatHistoryItem[];
    language?: 'vi' | 'en';
    clientApiKey?: string;
  }) {
    return this.request<{
      reply: string;
      engine: 'GEMINI_2_5_FLASH' | 'HYBRID_EXPERT_ENGINE';
      model?: string;
    }>('/recommendations/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Workouts
  static async submitWorkout(body: any) {
    return this.request<any>('/workouts/submit', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async submitCheckin(body: any) {
    return this.request<any>('/workouts/checkin', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async getWorkoutHistory() {
    return this.request<any[]>('/workouts/history');
  }

  static async getTodayStatus() {
    return this.request<any>('/workouts/today-status');
  }

  // Gamification & Shop
  static async getShopItems() {
    return this.request<any[]>('/gamification/shop');
  }

  static async buyShopItem(itemId: string) {
    return this.request<any>(`/gamification/shop/buy/${itemId}`, {
      method: 'POST',
    });
  }

  static async getInventory() {
    return this.request<any[]>('/gamification/inventory');
  }

  // Buddy
  static async getMyBuddy() {
    return this.request<any>('/buddy/my-buddy');
  }

  static async findBuddyMatches() {
    return this.request<any[]>('/buddy/matchmaking');
  }

  static async connectBuddy(targetUserId: string) {
    return this.request<any>(`/buddy/connect/${targetUserId}`, {
      method: 'POST',
    });
  }

  static async giftStreakFreeze(targetUserId: string, note?: string) {
    return this.request<any>(`/buddy/gift-freeze/${targetUserId}`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  static async unpairBuddy() {
    return this.request<any>('/buddy/unpair', {
      method: 'POST',
    });
  }

  // Notifications
  static async getNotifications() {
    return this.request<{ notifications: any[]; unreadCount: number }>('/notifications');
  }

  static async markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  static async markAllNotificationsRead() {
    return this.request<any>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  static async deleteNotification(id: string) {
    return this.request<any>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  static async clearAllNotifications() {
    return this.request<any>('/notifications', {
      method: 'DELETE',
    });
  }
}

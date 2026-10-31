const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('fit_token');
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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

  static async updateProfile(body: any) {
    return this.request<any>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // AI Recommendation
  static async getDailyRecommendation() {
    return this.request<any>('/recommendations/daily');
  }

  // Exercises
  static async getExercises(params?: { muscle?: string; injuries?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.muscle) query.set('muscle', params.muscle);
    if (params?.injuries) query.set('injuries', params.injuries);
    if (params?.search) query.set('search', params.search);
    return this.request<any[]>(`/exercises?${query.toString()}`);
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'API request failed');
    }
    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse(response);
    this.token = data.data.token;
    localStorage.setItem('authToken', this.token!);
    return data;
  }

  async register(userData: { name: string; email: string; password: string; company?: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    const data = await this.handleResponse(response);
    this.token = data.data.token;
    localStorage.setItem('authToken', this.token!);
    return data;
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // AI methods
  async validateApiKey(apiKey: string, provider: string) {
    const response = await fetch(`${API_BASE_URL}/ai/validate-key`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ apiKey, provider }),
    });
    return this.handleResponse(response);
  }

  async getAvailableModels(apiKey: string, provider: string) {
    const response = await fetch(`${API_BASE_URL}/ai/models`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ apiKey, provider }),
    });
    return this.handleResponse(response);
  }

  async generateOutline(params: any) {
    const response = await fetch(`${API_BASE_URL}/ai/generate-outline`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    return this.handleResponse(response);
  }

  async generateContent(params: any) {
    const response = await fetch(`${API_BASE_URL}/ai/generate-content`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    return this.handleResponse(response);
  }

  async getGenerationStatus(contentId: string) {
    const response = await fetch(`${API_BASE_URL}/ai/generation-status/${contentId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Content methods
  async getContent(page = 1, limit = 10, status?: string, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await fetch(`${API_BASE_URL}/content?${params}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getContentById(id: string) {
    const response = await fetch(`${API_BASE_URL}/content/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateContent(id: string, updates: any) {
    const response = await fetch(`${API_BASE_URL}/content/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteContent(id: string) {
    const response = await fetch(`${API_BASE_URL}/content/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Upload methods
  async uploadDocuments(files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  // User methods
  async updateProfile(profileData: any) {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });
    return this.handleResponse(response);
  }

  async updatePreferences(preferences: any) {
    const response = await fetch(`${API_BASE_URL}/user/preferences`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(preferences),
    });
    return this.handleResponse(response);
  }

  async updateAISettings(aiSettings: any) {
    const response = await fetch(`${API_BASE_URL}/user/ai-settings`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(aiSettings),
    });
    return this.handleResponse(response);
  }

  async getUserStats() {
    const response = await fetch(`${API_BASE_URL}/user/stats`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // WordPress methods
  async testWordPressConnection(connectionData: any) {
    const response = await fetch(`${API_BASE_URL}/wordpress/test-connection`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(connectionData),
    });
    return this.handleResponse(response);
  }

  async saveWordPressSettings(settings: any) {
    const response = await fetch(`${API_BASE_URL}/wordpress/settings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    return this.handleResponse(response);
  }

  async publishToWordPress(contentId: string, publishData: any) {
    const response = await fetch(`${API_BASE_URL}/wordpress/publish/${contentId}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(publishData),
    });
    return this.handleResponse(response);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }
}

export const apiService = new ApiService();
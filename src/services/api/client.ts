import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'cuoti_token';
const API_URL_KEY = 'cuoti_api_url';

let baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
let cachedToken: string | null = null;

export async function setApiUrl(url: string) {
  baseUrl = url;
  await AsyncStorage.setItem(API_URL_KEY, url);
}

export async function loadApiUrl() {
  const stored = await AsyncStorage.getItem(API_URL_KEY);
  if (stored) baseUrl = stored;
}

export function getApiUrl(): string {
  return baseUrl;
}

export async function setToken(token: string | null) {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function loadToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const token = await loadToken();
  const { timeout = 15000, ...init } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = (data as { error?: string }).error || `请求失败 (${res.status})`;
      throw new Error(msg);
    }

    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  options: { timeout?: number } = {}
): Promise<T> {
  const token = await loadToken();
  const { timeout = 30000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = (data as { error?: string }).error || `请求失败 (${res.status})`;
      throw new Error(msg);
    }

    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

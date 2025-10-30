/**
 * Centralized API Configuration
 * 
 * This file provides a single source of truth for API endpoints
 * Works in both development (localhost) and production (Vercel)
 */

// Determine the API base URL based on environment
export const getApiBaseUrl = (): string => {
  // In development (Vite), import.meta.env is available
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // If VITE_API_URL is explicitly set, use it
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  }

  // Auto-detect based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Development - localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Production - Vercel or any other domain
    // Use relative URLs (same origin as frontend)
    return '';
  }

  // Fallback for SSR or Node.js environment
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Build a complete API URL
 * @param endpoint - API endpoint (e.g., '/api/pcs' or 'api/pcs')
 */
export const buildApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /api
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

/**
 * Make an authenticated fetch request
 * @param endpoint - API endpoint
 * @param options - Fetch options
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: 'include',
  };

  const url = buildApiUrl(endpoint);
  const response = await fetch(url, mergedOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * API helper methods
 */
export const api = {
  get: (endpoint: string) => apiFetch(endpoint, { method: 'GET' }),
  
  post: (endpoint: string, data: any) => 
    apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: (endpoint: string, data: any) => 
    apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (endpoint: string) => 
    apiFetch(endpoint, { method: 'DELETE' }),
};


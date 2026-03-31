// API configuration
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://travelogerapi.travloger.in').replace(/\/$/, '')

interface FetchOptions extends RequestInit {
  handleError?: boolean;
  responseType?: 'json' | 'blob' | 'text';
}

export async function fetchApi<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const {
    headers = {},
    handleError = true,
    responseType = 'json',
    ...rest
  } = options;

  // If URL starts with /api, replace with backend URL
  const fullUrl = url.startsWith('/api')
    ? `${API_URL}${url}`
    : url.startsWith('http')
      ? url
      : `${API_URL}/api${url.startsWith('/') ? url : `/${url}`}`;

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // Check if body is FormData - if so, don't set Content-Type header
  const isFormData = rest.body instanceof FormData;
  const requestHeaders: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Accept': responseType === 'blob' ? '*/*' : 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...headers,
  };

  try {
    const response = await fetch(fullUrl, {
      headers: requestHeaders,
      ...rest,
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'API request failed' };
      }

      const error = new Error(errorData.error || 'API request failed');
      error.name = 'ApiError';
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }

    if (responseType === 'blob') {
      return await response.blob() as any;
    } else if (responseType === 'text') {
      return await response.text() as any;
    }

    return await response.json();
  } catch (error) {
    if (handleError) {
      console.error(`API Error (${fullUrl}):`, error);
      // Re-throw the error to be handled by the component
      throw error;
    }
    throw error;
  }
}

export function handleApiError(error: any, fallbackMessage?: string): string {
  if (error.name === 'ApiError') {
    return error.data?.error || error.message || fallbackMessage || 'API request failed';
  }
  return error.message || fallbackMessage || 'An unexpected error occurred';
}


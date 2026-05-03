import {
  AnalyticsResponse,
  AnalyticsQuery,
  ApplyPromocodePayload,
  AuthResponse,
  CreateOrderPayload,
  CreatePromocodePayload,
  LoginPayload,
  MeResponse,
  RegisterPayload,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

const buildAnalyticsQuery = (query: AnalyticsQuery, sortBy: string): string => {
  const params = new URLSearchParams({
    page: '1',
    pageSize: '10',
    sortBy,
    sortOrder: 'desc',
  });

  if (query.search) {
    params.set('search', query.search);
  }

  if (query.dateFrom) {
    params.set('dateFrom', query.dateFrom);
  }

  if (query.dateTo) {
    params.set('dateTo', query.dateTo);
  }

  return params.toString();
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message ?? 'Request failed';
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: LoginPayload) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: (token: string) => request<MeResponse>('/auth/me', {}, token),
  createPromocode: (token: string, payload: CreatePromocodePayload) =>
    request('/promocodes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),
  createOrder: (token: string, payload: CreateOrderPayload) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),
  myOrders: (token: string) => request('/orders/my', {}, token),
  applyPromocode: (
    token: string,
    orderId: string,
    payload: ApplyPromocodePayload,
  ) =>
    request(`/orders/${orderId}/apply-promocode`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),
  analyticsUsers: (token: string, query: AnalyticsQuery) =>
    request<AnalyticsResponse>(
      `/analytics/users?${buildAnalyticsQuery(query, 'totalSpent')}`,
      {},
      token,
    ),
  analyticsPromocodes: (token: string, query: AnalyticsQuery) =>
    request<AnalyticsResponse>(
      `/analytics/promocodes?${buildAnalyticsQuery(query, 'totalRevenue')}`,
      {},
      token,
    ),
  analyticsUsages: (token: string, query: AnalyticsQuery) =>
    request<AnalyticsResponse>(
      `/analytics/promo-usages?${buildAnalyticsQuery(query, 'appliedAt')}`,
      {},
      token,
    ),
};

export { ApiError };

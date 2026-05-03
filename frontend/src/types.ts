export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  name: string;
  phone: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type CreatePromocodePayload = {
  code: string;
  description?: string;
  discountPercent: number;
  totalUsageLimit: number;
  perUserUsageLimit: number;
  startsAt?: string;
  expiresAt?: string;
};

export type CreateOrderPayload = {
  amount: number;
};

export type ApplyPromocodePayload = {
  code: string;
};

export type AnalyticsResponse = {
  items: Array<Record<string, string | number | null>>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type AnalyticsQuery = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

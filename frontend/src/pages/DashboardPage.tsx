import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../components/AppShell';
import { AnalyticsTable } from '../components/AnalyticsTable';
import { api, ApiError } from '../lib/api';

type DashboardPageProps = {
  token: string;
  onLogout: () => void;
};

export function DashboardPage({ token, onLogout }: DashboardPageProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [feedback, setFeedback] = useState<string>('');
  const [promocodeForm, setPromocodeForm] = useState({
    code: '',
    description: '',
    discountPercent: 10,
    totalUsageLimit: 100,
    perUserUsageLimit: 1,
  });
  const [orderForm, setOrderForm] = useState({
    amount: 1000,
  });
  const [applyForm, setApplyForm] = useState({
    orderId: '',
    code: '',
  });

  const analyticsQuery = useMemo(
    () => ({
      search,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [dateFrom, dateTo, search],
  );

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(token),
  });

  const usersQuery = useQuery({
    queryKey: ['analytics-users', analyticsQuery],
    queryFn: () => api.analyticsUsers(token, analyticsQuery),
  });

  const promocodesQuery = useQuery({
    queryKey: ['analytics-promocodes', analyticsQuery],
    queryFn: () => api.analyticsPromocodes(token, analyticsQuery),
  });

  const usagesQuery = useQuery({
    queryKey: ['analytics-usages', analyticsQuery],
    queryFn: () => api.analyticsUsages(token, analyticsQuery),
  });

  const ordersQuery = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.myOrders(token) as Promise<Array<Record<string, unknown>>>,
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['analytics-users'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics-promocodes'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics-usages'] }),
      queryClient.invalidateQueries({ queryKey: ['my-orders'] }),
    ]);
  };

  const createPromocodeMutation = useMutation({
    mutationFn: () =>
      api.createPromocode(token, {
        code: promocodeForm.code,
        description: promocodeForm.description,
        discountPercent: Number(promocodeForm.discountPercent),
        totalUsageLimit: Number(promocodeForm.totalUsageLimit),
        perUserUsageLimit: Number(promocodeForm.perUserUsageLimit),
      }),
    onSuccess: async () => {
      setFeedback('Promocode created');
      await refreshAll();
    },
    onError: (error) => {
      setFeedback(
        error instanceof ApiError ? error.message : 'Failed to create promocode',
      );
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: () =>
      api.createOrder(token, {
        amount: Number(orderForm.amount),
      }),
    onSuccess: async () => {
      setFeedback('Order created');
      await refreshAll();
    },
    onError: (error) => {
      setFeedback(
        error instanceof ApiError ? error.message : 'Failed to create order',
      );
    },
  });

  const applyPromocodeMutation = useMutation({
    mutationFn: () =>
      api.applyPromocode(token, applyForm.orderId, {
        code: applyForm.code,
      }),
    onSuccess: async () => {
      setFeedback('Promocode applied');
      await refreshAll();
    },
    onError: (error) => {
      setFeedback(
        error instanceof ApiError ? error.message : 'Failed to apply promocode',
      );
    },
  });

  const handlePromocodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createPromocodeMutation.mutate();
  };

  const handleOrderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createOrderMutation.mutate();
  };

  const handleApplySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyPromocodeMutation.mutate();
  };

  const subtitle = useMemo(() => {
    if (meQuery.data?.user.email) {
      return `Signed in as ${meQuery.data.user.email}`;
    }

    return 'Authenticated workspace with live backend analytics';
  }, [meQuery.data?.user.email]);

  const applyPreset = (preset: 'today' | '7d' | '30d') => {
    const end = new Date();
    const start = new Date();

    if (preset === '7d') {
      start.setDate(end.getDate() - 7);
    } else if (preset === '30d') {
      start.setDate(end.getDate() - 30);
    }

    const startValue = start.toISOString().slice(0, 10);
    const endValue = end.toISOString().slice(0, 10);

    setDateFrom(startValue);
    setDateTo(endValue);
  };

  return (
    <AppShell
      title="Analytics command center"
      subtitle={subtitle}
      onLogout={onLogout}
    >
      <section className="toolbar-panel">
        <div>
          <label className="compact-label">
            <span>Global search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by email, name, or promo code"
            />
          </label>
        </div>
        <div className="date-preset-row">
          <button className="date-pill button-reset" onClick={() => applyPreset('today')} type="button">
            Today
          </button>
          <button className="date-pill button-reset" onClick={() => applyPreset('7d')} type="button">
            7 days
          </button>
          <button className="date-pill button-reset" onClick={() => applyPreset('30d')} type="button">
            30 days
          </button>
          <label className="compact-label compact-date">
            <span>From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label className="compact-label compact-date">
            <span>To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="action-grid" id="actions">
        <form className="action-card" onSubmit={handlePromocodeSubmit}>
          <h3>Create promocode</h3>
          <input
            placeholder="Code"
            value={promocodeForm.code}
            onChange={(event) =>
              setPromocodeForm((current) => ({
                ...current,
                code: event.target.value,
              }))
            }
            required
          />
          <input
            placeholder="Description"
            value={promocodeForm.description}
            onChange={(event) =>
              setPromocodeForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <div className="inline-grid">
            <input
              placeholder="Discount %"
              type="number"
              value={promocodeForm.discountPercent}
              onChange={(event) =>
                setPromocodeForm((current) => ({
                  ...current,
                  discountPercent: Number(event.target.value),
                }))
              }
              required
            />
            <input
              placeholder="Total limit"
              type="number"
              value={promocodeForm.totalUsageLimit}
              onChange={(event) =>
                setPromocodeForm((current) => ({
                  ...current,
                  totalUsageLimit: Number(event.target.value),
                }))
              }
              required
            />
            <input
              placeholder="Per user limit"
              type="number"
              value={promocodeForm.perUserUsageLimit}
              onChange={(event) =>
                setPromocodeForm((current) => ({
                  ...current,
                  perUserUsageLimit: Number(event.target.value),
                }))
              }
              required
            />
          </div>
          <button className="primary-button" type="submit">
            Create promocode
          </button>
        </form>

        <form className="action-card" onSubmit={handleOrderSubmit}>
          <h3>Create order</h3>
          <input
            placeholder="Amount"
            type="number"
            value={orderForm.amount}
            onChange={(event) =>
              setOrderForm({
                amount: Number(event.target.value),
              })
            }
            required
          />
          <button className="primary-button" type="submit">
            Create order
          </button>
        </form>

        <form className="action-card" onSubmit={handleApplySubmit}>
          <h3>Apply promocode</h3>
          <input
            placeholder="Order ID"
            value={applyForm.orderId}
            onChange={(event) =>
              setApplyForm((current) => ({
                ...current,
                orderId: event.target.value,
              }))
            }
            required
          />
          <input
            placeholder="Promo code"
            value={applyForm.code}
            onChange={(event) =>
              setApplyForm((current) => ({
                ...current,
                code: event.target.value,
              }))
            }
            required
          />
          <button className="primary-button" type="submit">
            Apply promocode
          </button>
        </form>
      </section>

      {feedback ? <div className="feedback-banner">{feedback}</div> : null}

      <div className="orders-panel">
        <h3>My orders</h3>
        <div className="orders-list">
          {(ordersQuery.data ?? []).map((order, index) => (
            <div className="order-row" key={String(order.id ?? index)}>
              <div>
                <strong>{String(order.id ?? 'order')}</strong>
                <span>{String(order.promocodeCode ?? 'No promocode')}</span>
              </div>
              <div>
                <strong>{String(order.finalAmount ?? order.amount ?? '-')}</strong>
                <span>Final amount</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-stack">
        <div id="users">
          <AnalyticsTable
            title="Users analytics"
            subtitle="Orders, spend, discounts, and promo adoption"
            data={usersQuery.data?.items ?? []}
            total={usersQuery.data?.meta.total ?? 0}
            emptyText="No user analytics yet"
          />
        </div>

        <div id="promocodes">
          <AnalyticsTable
            title="Promocodes analytics"
            subtitle="Revenue, usage counts, and unique users"
            data={promocodesQuery.data?.items ?? []}
            total={promocodesQuery.data?.meta.total ?? 0}
            emptyText="No promocodes yet"
          />
        </div>

        <div id="usages">
          <AnalyticsTable
            title="Promo usage history"
            subtitle="Every applied promocode with order and user context"
            data={usagesQuery.data?.items ?? []}
            total={usagesQuery.data?.meta.total ?? 0}
            emptyText="No promo usage events yet"
          />
        </div>
      </div>
    </AppShell>
  );
}

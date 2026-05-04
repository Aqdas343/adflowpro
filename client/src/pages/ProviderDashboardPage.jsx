import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProviderOrdersApi, startOrderApi, deliverOrderApi } from '../api/orders';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';

const statusColors = {
  placed:              'bg-gray-100 text-gray-600',
  payment_pending:     'bg-yellow-100 text-yellow-700',
  payment_verified:    'bg-blue-100 text-blue-700',
  in_progress:         'bg-purple-100 text-purple-700',
  delivered:           'bg-orange-100 text-orange-700',
  revision_requested:  'bg-pink-100 text-pink-700',
  completed:           'bg-green-100 text-green-700',
  closed:              'bg-gray-200 text-gray-500',
  cancelled:           'bg-red-100 text-red-600',
};

const TABS = ['all', 'payment_verified', 'in_progress', 'delivered', 'revision_requested', 'completed'];

function DeadlineBadge({ deadline }) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (days > 5) return null;
  const color = days <= 2 ? 'text-red-600' : 'text-amber-600';
  const label = days <= 0 ? 'Overdue!' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="stat-card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ProviderDashboardPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' });
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async (pageNum = 1, statusFilter = 'all') => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await getProviderOrdersApi(params);
      setOrders(data.orders);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Provider Dashboard — GigMarket';
    return () => { document.title = 'GigMarket'; };
  }, []);

  useEffect(() => {
    getProviderOrdersApi({ limit: 100 }).then(({ data }) => setAllOrders(data.orders)).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    fetchOrders(1, filter);
  }, [filter, fetchOrders]);

  const act = async (fn, orderId, successMsg) => {
    setActionMsg({ text: '', type: 'success' });
    setBusyId(orderId);
    try {
      await fn(orderId);
      setActionMsg({ text: successMsg, type: 'success' });
      fetchOrders(page, filter);
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const completed = allOrders.filter((o) => o.status === 'completed').length;
  const active = allOrders.filter((o) => ['payment_verified', 'in_progress', 'delivered', 'revision_requested'].includes(o.status)).length;
  const completionRate = allOrders.length > 0 ? Math.round((completed / allOrders.length) * 100) : 0;
  const totalEarned = allOrders.filter((o) => o.status === 'completed').reduce((s, o) => s + (o.package?.price ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Provider Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your incoming orders</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Earned" value={`$${totalEarned.toLocaleString()}`} color="text-brand-700" />
        <StatCard label="Active Orders" value={active} sub={<div className="w-full bg-gray-100 rounded-full h-1 mt-1"><div className="bg-blue-500 h-1 rounded-full" style={{ width: `${Math.min(active * 10, 100)}%` }} /></div>} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} sub={<div className="w-full bg-gray-100 rounded-full h-1 mt-1"><div className="bg-amber-400 h-1 rounded-full" style={{ width: `${completionRate}%` }} /></div>} />
        <StatCard label="Completed" value={completed} color="text-green-600" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {actionMsg.text && <div className="mb-5"><Alert message={actionMsg.text} variant={actionMsg.type} /></div>}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : error ? (
        <Alert message={error} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={filter === 'all' ? 'No orders yet' : `No ${filter.replace(/_/g, ' ')} orders`}
          description={filter === 'all' ? 'Create a gig and start receiving orders from clients.' : undefined}
          action={filter === 'all' ? <Link to="/create-gig" className="btn-primary">Create a Gig →</Link> : undefined}
        />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{order.gig?.title ?? 'Gig'}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Client: <span className="font-medium">{order.client?.name}</span>
                    {order.package && <span className="text-gray-400"> · {order.package.type} · ${order.package.price}</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <DeadlineBadge deadline={order.deadline} />
                    {order.deadline && (
                      <span className="text-xs text-gray-400">
                        {new Date(order.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <span className={`badge shrink-0 ${statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>

                <div className="flex gap-2 shrink-0">
                  {(order.status === 'payment_verified' || order.status === 'revision_requested') && (
                    <button onClick={() => act(startOrderApi, order._id, 'Work started!')} disabled={busyId === order._id} className="btn-primary text-sm">
                      {busyId === order._id ? 'Starting…' : '▶ Start Work'}
                    </button>
                  )}
                  {order.status === 'in_progress' && (
                    <button onClick={() => act(deliverOrderApi, order._id, 'Delivered!')} disabled={busyId === order._id} className="btn-primary text-sm">
                      {busyId === order._id ? 'Delivering…' : '✓ Mark Delivered'}
                    </button>
                  )}
                  {(order.status === 'delivered' || order.status === 'completed') && (
                    <span className="text-xs text-gray-400 italic self-center">
                      {order.status === 'completed' ? 'Completed ✓' : 'Awaiting confirmation'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button onClick={() => { setPage(page - 1); fetchOrders(page - 1, filter); }} disabled={page === 1} className="btn-secondary">← Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
              <button onClick={() => { setPage(page + 1); fetchOrders(page + 1, filter); }} disabled={page === pagination.pages} className="btn-secondary">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

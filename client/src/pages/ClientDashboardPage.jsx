import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrdersApi, submitPaymentApi, completeOrderApi, requestRevisionApi, submitReviewApi } from '../api/orders';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
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

const PAYMENT_METHODS = ['bank_transfer', 'easypaisa', 'jazzcash', 'card', 'other'];

function PayModal({ order, onClose, onPaid }) {
  const [form, setForm] = useState({ method: 'easypaisa', transactionRef: '', senderName: '', screenshotUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { method: form.method, transactionRef: form.transactionRef };
      if (form.senderName) payload.senderName = form.senderName;
      if (form.screenshotUrl) payload.screenshotUrl = form.screenshotUrl;
      await submitPaymentApi(order._id, payload);
      onPaid();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <h2 className="text-lg font-semibold mb-1">Submit Payment</h2>
      <p className="text-sm text-gray-500 mb-4">Amount: <strong>${order.package?.price ?? '—'}</strong></p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert message={error} />
        <div>
          <label className="label">Payment Method</label>
          <select name="method" value={form.method} onChange={handleChange} className="input">
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Transaction Reference *</label>
          <input name="transactionRef" className="input" placeholder="e.g. TXN-20240101-001"
            value={form.transactionRef} onChange={handleChange} required minLength={4} />
        </div>
        <div>
          <label className="label">Sender Name</label>
          <input name="senderName" className="input" placeholder="Name on the account"
            value={form.senderName} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Screenshot URL (optional)</label>
          <input name="screenshotUrl" className="input" placeholder="https://i.imgur.com/..."
            value={form.screenshotUrl} onChange={handleChange} />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting…' : 'Submit Payment'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function ReviewModal({ order, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitReviewApi(order._id, { rating, comment: comment || undefined });
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm">
      <h2 className="text-lg font-semibold mb-1">Leave a Review</h2>
      <p className="text-sm text-gray-500 mb-4 line-clamp-1">{order.gig?.title}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert message={error} />
        <div>
          <label className="label">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Comment (optional)</label>
          <textarea className="input resize-none" rows={3}
            placeholder="Share your experience…"
            value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function RevisionModal({ order, onClose, onSubmitted }) {  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestRevisionApi(order._id, { note });
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm">
      <h2 className="text-lg font-semibold mb-4">Request Revision</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert message={error} />
        <div>
          <label className="label">What needs to be changed?</label>
          <textarea className="input resize-none" rows={4} placeholder="Describe what you'd like revised..."
            value={note} onChange={(e) => setNote(e.target.value)} required minLength={5} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting…' : 'Request Revision'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ClientDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' });
  const [payingOrder, setPayingOrder] = useState(null);
  const [revisionOrder, setRevisionOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());

  const fetchOrders = useCallback(async (pageNum) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getMyOrdersApi({ page: pageNum, limit: 10 });
      setOrders(data.orders);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'My Orders — GigMarket';
    return () => { document.title = 'GigMarket'; };
  }, []);

  useEffect(() => { fetchOrders(page); }, [page, fetchOrders]);

  const handleComplete = async (orderId) => {
    setActionMsg({ text: '', type: 'success' });
    setCompletingId(orderId);
    try {
      await completeOrderApi(orderId);
      setActionMsg({ text: 'Order marked as complete!', type: 'success' });
      fetchOrders(page);
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Orders</h1>
      <p className="text-sm text-gray-500 mb-6">Track and manage your orders</p>

      {actionMsg.text && (
        <div className="mb-5"><Alert message={actionMsg.text} variant={actionMsg.type} /></div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : error ? (
        <Alert message={error} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="Browse our marketplace and find the perfect gig to get started."
          action={<Link to="/" className="btn-primary">Browse Gigs →</Link>}
        />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{order.gig?.title ?? 'Gig'}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Provider: {order.provider?.name}
                    {order.package && <span> · {order.package.type} · ${order.package.price}</span>}
                  </p>
                  {order.deadline && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Deadline: {new Date(order.deadline).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Placed {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <span className={`badge shrink-0 ${statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>

                <div className="flex gap-2 shrink-0 flex-wrap">
                  {order.status === 'placed' && (
                    <button onClick={() => setPayingOrder(order)} className="btn-primary text-sm">Pay Now</button>
                  )}
                  {order.status === 'delivered' && (
                    <>
                      <button onClick={() => handleComplete(order._id)} disabled={completingId === order._id} className="btn-primary text-sm">
                        {completingId === order._id ? 'Completing…' : 'Accept'}
                      </button>
                      <button onClick={() => setRevisionOrder(order)} className="btn-secondary text-sm">Revision</button>
                    </>
                  )}
                  {order.status === 'completed' && !order.hasReview && !reviewedOrderIds.has(order._id) && (
                    <button onClick={() => setReviewOrder(order)} className="btn-secondary text-sm">★ Review</button>
                  )}
                  {order.status === 'completed' && (order.hasReview || reviewedOrderIds.has(order._id)) && (
                    <span className="text-xs text-green-600 font-medium self-center">✓ Reviewed</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary">← Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page === pagination.pages} className="btn-secondary">Next →</button>
            </div>
          )}
        </>
      )}

      {payingOrder && (
        <PayModal
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaid={() => {
            setPayingOrder(null);
            setActionMsg({ text: 'Payment submitted! Awaiting admin verification.', type: 'success' });
            fetchOrders(page);
          }}
        />
      )}

      {revisionOrder && (
        <RevisionModal
          order={revisionOrder}
          onClose={() => setRevisionOrder(null)}
          onSubmitted={() => {
            setRevisionOrder(null);
            setActionMsg({ text: 'Revision requested. Provider will be notified.', type: 'info' });
            fetchOrders(page);
          }}
        />
      )}

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSubmitted={() => {
            setReviewedOrderIds((prev) => new Set([...prev, reviewOrder._id]));
            setReviewOrder(null);
            setActionMsg({ text: 'Review submitted. Thank you!', type: 'success' });
          }}
        />
      )}
    </div>
  );
}

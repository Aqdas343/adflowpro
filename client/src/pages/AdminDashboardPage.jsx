import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { moderateGigApi, activateGigApi } from '../api/gigs';
import { getPendingPaymentsApi, verifyPaymentApi } from '../api/orders';
import GigCard from '../components/GigCard';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const TOP_TABS = ['gigs', 'payments'];
const GIG_TABS = ['submitted', 'approved', 'active'];

function RejectModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(reason || undefined);
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm">
      <h2 className="text-lg font-semibold mb-4">Reject Payment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Rejection Reason (optional)</label>
          <textarea className="input resize-none" rows={3}
            placeholder="e.g. Transaction reference not found in bank records."
            value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-danger flex-1">
            {loading ? 'Rejecting…' : 'Confirm Reject'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function GigRejectModal({ onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(note || undefined);
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm">
      <h2 className="text-lg font-semibold mb-4">Reject Gig</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Rejection Note (optional)</label>
          <textarea className="input resize-none" rows={3}
            placeholder="e.g. Description needs more detail about deliverables."
            value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-danger flex-1">
            {loading ? 'Rejecting…' : 'Confirm Reject'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function PaymentsPanel() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' });
  const [verifyingId, setVerifyingId] = useState(null);
  const [rejectingPayment, setRejectingPayment] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getPendingPaymentsApi();
      setPayments(data.payments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleVerify = async (paymentId) => {
    setActionMsg({ text: '', type: 'success' });
    setVerifyingId(paymentId);
    try {
      await verifyPaymentApi(paymentId, { action: 'verify' });
      setActionMsg({ text: 'Payment verified. Order is now ready to start.', type: 'success' });
      fetchPayments();
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleReject = async (paymentId, reason) => {
    setActionMsg({ text: '', type: 'success' });
    setVerifyingId(paymentId);
    try {
      await verifyPaymentApi(paymentId, { action: 'reject', rejectionReason: reason });
      setActionMsg({ text: 'Payment rejected.', type: 'info' });
      fetchPayments();
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setVerifyingId(null);
      setRejectingPayment(null);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">Review and verify pending client payments</p>
      {actionMsg.text && <div className="mb-5"><Alert message={actionMsg.text} variant={actionMsg.type} /></div>}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : error ? (
        <Alert message={error} />
      ) : payments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No pending payments at the moment.</div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment._id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{payment.order?.gig?.title ?? 'Gig'}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Client: {payment.order?.client?.name}
                  {payment.order?.client?.email && (
                    <span className="text-gray-400"> · {payment.order.client.email}</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  Amount: <span className="font-semibold text-gray-800">${payment.amount}</span>
                  {' · '}{payment.method?.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {payment.transactionRef}</p>
                <p className="text-xs text-gray-400">Submitted {new Date(payment.createdAt).toLocaleString()}</p>
              </div>
              <span className="badge bg-yellow-100 text-yellow-700 shrink-0">pending</span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleVerify(payment._id)}
                  disabled={verifyingId === payment._id}
                  className="btn-primary text-sm"
                >
                  {verifyingId === payment._id ? 'Processing…' : '✓ Verify'}
                </button>
                <button
                    onClick={() => setRejectingPayment(payment._id)}
                    disabled={verifyingId === payment._id}
                    className="btn-danger text-sm"
                  >
                    ✕ Reject
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {rejectingPayment && (
        <RejectModal
          onClose={() => setRejectingPayment(null)}
          onConfirm={(reason) => handleReject(rejectingPayment, reason)}
        />
      )}
    </div>
  );
}

function GigsPanel() {
  const [gigTab, setGigTab] = useState('submitted');
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' });
  const [busyId, setBusyId] = useState(null);
  const [rejectingGig, setRejectingGig] = useState(null);

  const fetchGigs = useCallback(async (status) => {
    setLoading(true);
    setError('');
    setActionMsg({ text: '', type: 'success' });
    try {
      const { data } = await api.get('/gigs/admin/all', { params: { status } });
      setGigs(data.gigs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGigs(gigTab); }, [gigTab, fetchGigs]);

  const handleModerate = async (gigId, action, note) => {
    setActionMsg({ text: '', type: 'success' });
    setBusyId(gigId);
    try {
      await moderateGigApi(gigId, action, note);
      if (action === 'approve') {
        await activateGigApi(gigId);
        setActionMsg({ text: 'Gig approved and is now active.', type: 'success' });
      } else {
        setActionMsg({ text: 'Gig rejected.', type: 'info' });
      }
      fetchGigs(gigTab);
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setBusyId(null);
      setRejectingGig(null);
    }
  };

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {GIG_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setGigTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
              ${gigTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {actionMsg.text && <div className="mb-5"><Alert message={actionMsg.text} variant={actionMsg.type} /></div>}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : error ? (
        <Alert message={error} />
      ) : gigs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No {gigTab} gigs at the moment.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gigs.map((gig) => (
            <GigCard
              key={gig._id}
              gig={gig}
              actions={
                gigTab === 'submitted' && (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleModerate(gig._id, 'approve')}
                      disabled={busyId === gig._id}
                      className="btn-primary flex-1 text-sm"
                    >
                      {busyId === gig._id ? 'Processing…' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => setRejectingGig(gig._id)}
                      disabled={busyId === gig._id}
                      className="btn-danger flex-1 text-sm"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )
              }
            />
          ))}
        </div>
      )}
      {rejectingGig && (
        <GigRejectModal
          onClose={() => setRejectingGig(null)}
          onConfirm={(note) => handleModerate(rejectingGig, 'reject', note)}
        />
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [topTab, setTopTab] = useState('gigs');

  useEffect(() => {
    document.title = 'Admin Dashboard — GigMarket';
    return () => { document.title = 'GigMarket'; };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        {TOP_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTopTab(t)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors capitalize
              ${topTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {topTab === 'gigs'     && <GigsPanel />}
      {topTab === 'payments' && <PaymentsPanel />}
    </div>
  );
}

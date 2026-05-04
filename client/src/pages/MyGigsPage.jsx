import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProviderGigsApi, submitGigApi } from '../api/gigs';
import GigCard from '../components/GigCard';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

export default function MyGigsPage() {
  const [gigs, setGigs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' });
  const [submittingId, setSubmittingId] = useState(null);

  const fetchGigs = useCallback(async (pageNum) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getProviderGigsApi({ page: pageNum, limit: 10 });
      setGigs(data.gigs);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGigs(page); }, [page, fetchGigs]);

  useEffect(() => {
    document.title = 'My Gigs — GigMarket';
    return () => { document.title = 'GigMarket'; };
  }, []);

  const handleSubmit = async (gigId) => {
    setActionMsg({ text: '', type: 'success' });
    setSubmittingId(gigId);
    try {
      await submitGigApi(gigId);
      setActionMsg({ text: 'Gig submitted for review!', type: 'success' });
      fetchGigs(page);
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Gigs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your service listings</p>
        </div>
        <Link to="/create-gig" className="btn-primary">+ New Gig</Link>
      </div>

      {actionMsg.text && (
        <div className="mb-5"><Alert message={actionMsg.text} variant={actionMsg.type} /></div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : error ? (
        <Alert message={error} />
      ) : gigs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">You haven't created any gigs yet.</p>
          <Link to="/create-gig" className="btn-primary">Create your first gig →</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gigs.map((gig) => (
              <GigCard
                key={gig._id}
                gig={gig}
                showStatus
                actions={
                  <div className="flex gap-2 w-full">
                    {(gig.status === 'draft' || gig.status === 'rejected') && (
                      <>
                        <Link to={`/edit-gig/${gig._id}`} className="btn-secondary flex-1 text-sm text-center">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleSubmit(gig._id)}
                          disabled={submittingId === gig._id}
                          className="btn-primary flex-1 text-sm"
                        >
                          {submittingId === gig._id ? 'Submitting…' : 'Submit'}
                        </button>
                      </>
                    )}
                    {gig.status === 'submitted' && (
                      <span className="text-xs text-yellow-600 italic self-center">Under review…</span>
                    )}
                    {gig.status === 'approved' && (
                      <span className="text-xs text-blue-600 italic self-center">Awaiting activation</span>
                    )}
                    {gig.status === 'active' && (
                      <span className="text-xs text-green-600 font-medium self-center">✓ Live</span>
                    )}
                    {gig.status === 'rejected' && gig.moderationNote && (
                      <p className="text-xs text-red-500 mt-1 w-full">Reason: {gig.moderationNote}</p>
                    )}
                  </div>
                }
              />
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
    </div>
  );
}

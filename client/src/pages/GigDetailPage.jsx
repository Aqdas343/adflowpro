import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGigBySlugApi } from '../api/gigs';
import { placeOrderApi } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';

const COVER_PALETTES = [
  { bg: 'bg-violet-100', emoji: '🎨' },
  { bg: 'bg-emerald-100', emoji: '⚡' },
  { bg: 'bg-amber-100', emoji: '📈' },
  { bg: 'bg-sky-100', emoji: '💻' },
  { bg: 'bg-rose-100', emoji: '✍️' },
  { bg: 'bg-indigo-100', emoji: '🎬' },
  { bg: 'bg-teal-100', emoji: '🔧' },
  { bg: 'bg-orange-100', emoji: '📱' },
];

function getCoverPalette(title = '') {
  return COVER_PALETTES[title.charCodeAt(0) % COVER_PALETTES.length];
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name = '') {
  const colors = ['bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500', 'bg-indigo-500'];
  return colors[name.charCodeAt(0) % colors.length];
}

function OrderModal({ gig, packages, onClose, onOrdered }) {
  const [ordering, setOrdering] = useState(null);
  const [error, setError] = useState('');

  const handleOrder = async (packageId) => {
    setError('');
    setOrdering(packageId);
    try {
      await placeOrderApi({ gigId: gig._id, packageId });
      onOrdered();
    } catch (err) {
      setError(err.message);
    } finally {
      setOrdering(null);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Choose a Package</h2>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{gig.title}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">×</button>
      </div>
      <Alert message={error} />
      <div className="space-y-3">
        {packages.map((pkg) => (
          <div key={pkg._id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-brand-300 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge bg-gray-100 text-gray-600 capitalize">{pkg.type}</span>
                <span className="font-semibold text-sm text-gray-900">{pkg.name}</span>
              </div>
              {pkg.description && <p className="text-xs text-gray-500">{pkg.description}</p>}
              <p className="text-xs text-gray-400 mt-1">
                {pkg.deliveryDays}d delivery · {pkg.revisions ?? 1} revision{pkg.revisions !== 1 ? 's' : ''}
              </p>
              {pkg.features?.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-brand-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-gray-900">${pkg.price}</p>
              <button onClick={() => handleOrder(pkg._id)} disabled={ordering !== null} className="btn-primary text-xs mt-1.5 px-4 py-1.5">
                {ordering === pkg._id ? 'Ordering…' : 'Order'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function GigDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gig, setGig] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');

  useEffect(() => {
    getGigBySlugApi(slug)
      .then(({ data }) => {
        setGig(data.gig);
        setPackages(data.packages);
        document.title = `${data.gig.title} — GigMarket`;
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => { document.title = 'GigMarket'; };
  }, [slug]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  if (error || !gig) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <EmptyState icon="🔍" title="Gig not found" description="This gig may have been removed or is no longer active." action={<Link to="/" className="btn-primary">Browse Gigs</Link>} />
      </div>
    );
  }

  const cover = getCoverPalette(gig.title);
  const lowestPrice = packages.length > 0 ? Math.min(...packages.map((p) => p.price)) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
        ← Back
      </button>

      {orderSuccess && (
        <div className="mb-6">
          <Alert message={orderSuccess} variant="success" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover */}
          <div className={`${cover.bg} rounded-2xl h-52 flex items-center justify-center`}>
            <span className="text-7xl select-none">{cover.emoji}</span>
          </div>

          {/* Title + meta */}
          <div>
            {gig.category?.name && (
              <span className="badge bg-brand-50 text-brand-700 mb-3">{gig.category.name}</span>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{gig.title}</h1>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${getAvatarColor(gig.provider?.name)} flex items-center justify-center text-white text-xs font-bold`}>
                  {getInitials(gig.provider?.name)}
                </div>
                <span className="font-medium text-gray-900">{gig.provider?.name}</span>
              </div>
              {gig.ratingAvg > 0 && (
                <span className="text-amber-500 font-semibold">
                  ★ {gig.ratingAvg.toFixed(1)}
                  <span className="text-gray-400 font-normal ml-1">({gig.totalReviews} reviews)</span>
                </span>
              )}
              {gig.totalOrders > 0 && (
                <span className="text-gray-400">{gig.totalOrders} orders</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">About this gig</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{gig.description}</p>
          </div>

          {/* Tags */}
          {gig.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {gig.tags.map((tag) => (
                <span key={tag} className="badge bg-gray-100 text-gray-600">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right — packages sidebar */}
        <div className="space-y-4">
          {packages.length === 0 ? (
            <div className="card text-center text-gray-400 text-sm py-8">No packages available.</div>
          ) : (
            packages.map((pkg) => (
              <div key={pkg._id} className="card border-2 hover:border-brand-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge bg-gray-100 text-gray-600 capitalize">{pkg.type}</span>
                  <span className="text-xl font-bold text-gray-900">${pkg.price}</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{pkg.name}</p>
                {pkg.description && <p className="text-xs text-gray-500 mb-3">{pkg.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>⏱ {pkg.deliveryDays}d delivery</span>
                  <span>↩ {pkg.revisions ?? 1} revision{pkg.revisions !== 1 ? 's' : ''}</span>
                </div>
                {pkg.features?.length > 0 && (
                  <ul className="space-y-1 mb-4">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <span className="text-brand-500 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                )}
                {user?.role === 'client' && (
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="btn-primary w-full text-sm"
                  >
                    Order — ${pkg.price}
                  </button>
                )}
              </div>
            ))
          )}

          {user?.role === 'client' && packages.length > 1 && (
            <button onClick={() => setShowOrderModal(true)} className="btn-secondary w-full text-sm">
              Compare all packages
            </button>
          )}

          {!user && (
            <div className="card text-center">
              <p className="text-sm text-gray-500 mb-3">Sign in to place an order</p>
              <Link to="/login" className="btn-primary w-full text-sm">Sign in</Link>
            </div>
          )}
        </div>
      </div>

      {showOrderModal && (
        <OrderModal
          gig={gig}
          packages={packages}
          onClose={() => setShowOrderModal(false)}
          onOrdered={() => {
            setShowOrderModal(false);
            setOrderSuccess('Order placed! Go to My Orders to continue.');
          }}
        />
      )}
    </div>
  );
}

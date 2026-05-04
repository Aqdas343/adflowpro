import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getActiveGigsApi, getCategoriesApi, getGigPackagesApi } from '../api/gigs';
import { placeOrderApi } from '../api/orders';
import { debounce } from '../utils/debounce';
import GigCard from '../components/GigCard';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';

function PackageModal({ gig, onClose, onOrdered }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getGigPackagesApi(gig._id)
      .then(({ data }) => setPackages(data.packages))
      .catch(() => setError('Failed to load packages.'))
      .finally(() => setLoading(false));
  }, [gig._id]);

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
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : packages.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No packages available.</p>
      ) : (
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
      )}
    </Modal>
  );
}

const CATEGORY_EMOJIS = {
  'web-development': '💻',
  'graphic-design': '🎨',
  'seo': '📈',
  'writing': '✍️',
  'video': '🎬',
  'marketing': '📣',
  'mobile': '📱',
  'data': '📊',
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [gigs, setGigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderMsg, setOrderMsg] = useState('');
  const [selectedGig, setSelectedGig] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGigs = useCallback(async (page = 1, category = '', search = '') => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 9 };
      if (category) params.category = category;
      if (search) params.search = search;
      const { data } = await getActiveGigsApi(params);
      setGigs(data.gigs);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const activeCategoryRef = useRef(activeCategory);
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);

  const debouncedSearchRef = useRef(
    debounce((value) => {
      setSearchQuery(value);
      fetchGigs(1, activeCategoryRef.current, value);
    }, 400)
  );

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSearchRef.current(e.target.value);
  };

  useEffect(() => {
    getCategoriesApi().then(({ data }) => setCategories(data.categories)).catch(() => {});
    fetchGigs(1);
  }, [fetchGigs]);

  const handleCategoryClick = (catId) => {
    const next = activeCategory === catId ? '' : catId;
    setActiveCategory(next);
    fetchGigs(1, next, searchQuery);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    fetchGigs(1, activeCategory, searchInput);
  };
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              {pagination.total > 0 ? `${pagination.total.toLocaleString()}+ active gigs live now` : 'Marketplace live'}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Find{' '}
              <em className="font-serif not-italic text-brand-600" style={{ fontStyle: 'italic', fontWeight: 400 }}>
                expert
              </em>{' '}
              freelancers<br />
              for any project
            </h1>

            <p className="text-gray-500 text-lg mb-8">
              Connect with skilled providers across design, development, marketing, and more.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search for any service…"
                className="input flex-1 py-3 text-base"
              />
              <button type="submit" className="btn-primary px-6 py-3 text-base">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Category chips ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-4 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleCategoryClick('')}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                activeCategory === ''
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleCategoryClick(cat._id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  activeCategory === cat._id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{CATEGORY_EMOJIS[cat.slug] ?? '🔹'}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Gig grid ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {orderMsg && (
          <div className="mb-6 max-w-lg">
            <Alert message={orderMsg} variant={orderMsg.startsWith('Order placed') ? 'success' : 'error'} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : error ? (
          <Alert message={error} />
        ) : gigs.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={searchQuery || activeCategory ? 'No gigs found' : 'No gigs yet'}
            description={searchQuery || activeCategory ? 'Try different search terms or clear the filters.' : 'Active gigs will appear here once providers publish them.'}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeCategory
                  ? categories.find((c) => c._id === activeCategory)?.name
                  : searchQuery
                  ? `Results for "${searchQuery}"`
                  : 'Featured Gigs'}
              </h2>
              <span className="text-sm text-gray-400">{pagination.total} gig{pagination.total !== 1 ? 's' : ''}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gigs.map((gig) => (
                <GigCard
                  key={gig._id}
                  gig={gig}
                  actions={
                    user?.role === 'client' && (
                      <button
                        onClick={() => { setOrderMsg(''); setSelectedGig(gig); }}
                        className="btn-primary w-full text-sm"
                      >
                        View Packages
                      </button>
                    )
                  }
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button onClick={() => fetchGigs(pagination.page - 1, activeCategory, searchQuery)} disabled={pagination.page === 1} className="btn-secondary">
                  ← Prev
                </button>
                <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
                <button onClick={() => fetchGigs(pagination.page + 1, activeCategory, searchQuery)} disabled={pagination.page === pagination.pages} className="btn-secondary">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedGig && (
        <PackageModal
          gig={selectedGig}
          onClose={() => setSelectedGig(null)}
          onOrdered={() => {
            setSelectedGig(null);
            setOrderMsg('Order placed! Head to My Orders to continue.');
          }}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGigApi, submitGigApi, addGigPackageApi, getCategoriesApi } from '../api/gigs';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const PACKAGE_TYPES = ['basic', 'standard', 'premium'];

const emptyPackage = { name: '', description: '', price: '', deliveryDays: '', revisions: '1', features: '' };

export default function CreateGigPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  const [gigForm, setGigForm] = useState({ category: '', title: '', description: '', tags: '' });
  const [packages, setPackages] = useState({ basic: { ...emptyPackage }, standard: { ...emptyPackage }, premium: { ...emptyPackage } });
  const [activePackageTab, setActivePackageTab] = useState('basic');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdGig, setCreatedGig] = useState(null);
  const [addedPackages, setAddedPackages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategoriesApi()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => setError('Failed to load categories.'))
      .finally(() => setCatLoading(false));
  }, []);

  const handleGigChange = (e) =>
    setGigForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePackageChange = (type, e) =>
    setPackages((p) => ({ ...p, [type]: { ...p[type], [e.target.name]: e.target.value } }));

  const handleCreateGig = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!gigForm.category) { setError('Please select a category.'); return; }
    setLoading(true);
    try {
      const tags = gigForm.tags ? gigForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const { data } = await createGigApi({ category: gigForm.category, title: gigForm.title, description: gigForm.description, tags });
      setCreatedGig(data.gig);
      setSuccess('Gig created as draft. Now add at least one pricing package.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = async (type) => {
    setError('');
    const pkg = packages[type];
    if (!pkg.name || !pkg.price || !pkg.deliveryDays) {
      setError(`Please fill in name, price, and delivery days for the ${type} package.`);
      return;
    }
    setLoading(true);
    try {
      const features = pkg.features ? pkg.features.split(',').map((f) => f.trim()).filter(Boolean) : [];
      await addGigPackageApi(createdGig._id, {
        type,
        name: pkg.name,
        description: pkg.description || undefined,
        price: Number(pkg.price),
        deliveryDays: Number(pkg.deliveryDays),
        revisions: Number(pkg.revisions) || 1,
        features,
      });
      setAddedPackages((p) => [...p.filter((t) => t !== type), type]);
      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} package added.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGig = async () => {
    if (addedPackages.length === 0) { setError('Add at least one package before submitting.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await submitGigApi(createdGig._id);
      setSuccess('Gig submitted for review! A moderator will review it shortly.');
      setTimeout(() => navigate('/my-gigs'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (catLoading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create a Gig</h1>
      <p className="text-sm text-gray-500 mb-6">Describe your service, then add pricing packages</p>

      <Alert message={error} />
      {success && <div className="mb-4"><Alert message={success} variant="success" /></div>}

      {!createdGig ? (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Step 1 — Gig Details</h2>
          <form onSubmit={handleCreateGig} className="space-y-5">
            <div>
              <label className="label">Category *</label>
              <select name="category" value={gigForm.category} onChange={handleGigChange} className="input" required>
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="label">Title *</label>
              <input id="title" name="title" type="text" required className="input"
                placeholder="e.g. I will build a professional React website"
                value={gigForm.title} onChange={handleGigChange} minLength={10} maxLength={100} />
            </div>

            <div>
              <label htmlFor="description" className="label">Description *</label>
              <textarea id="description" name="description" required rows={6} className="input resize-none"
                placeholder="Describe what you'll deliver, your process, and what's included…"
                value={gigForm.description} onChange={handleGigChange} minLength={50} maxLength={3000} />
              <p className="text-xs text-gray-400 mt-1">{gigForm.description.length} / 3000</p>
            </div>

            <div>
              <label htmlFor="tags" className="label">Tags (comma-separated)</label>
              <input id="tags" name="tags" type="text" className="input"
                placeholder="e.g. react, nodejs, fullstack"
                value={gigForm.tags} onChange={handleGigChange} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating…' : 'Create Gig Draft →'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card bg-green-50 border-green-200">
            <p className="text-sm text-green-700 font-medium">✓ Gig created: <span className="font-semibold">{createdGig.title}</span></p>
            <p className="text-xs text-green-600 mt-1">Now add pricing packages below. At least one is required before submitting.</p>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">Step 2 — Pricing Packages</h2>

            <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
              {PACKAGE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActivePackageTab(t)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize relative
                    ${activePackageTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t}
                  {addedPackages.includes(t) && (
                    <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-green-500" />
                  )}
                </button>
              ))}
            </div>

            {PACKAGE_TYPES.map((type) => (
              <div key={type} className={activePackageTab === type ? 'block' : 'hidden'}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Package Name *</label>
                      <input name="name" className="input" placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} Package`}
                        value={packages[type].name} onChange={(e) => handlePackageChange(type, e)} />
                    </div>
                    <div>
                      <label className="label">Price ($) *</label>
                      <input name="price" type="number" min={1} max={10000} className="input" placeholder="50"
                        value={packages[type].price} onChange={(e) => handlePackageChange(type, e)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Delivery Days *</label>
                      <input name="deliveryDays" type="number" min={1} max={365} className="input" placeholder="3"
                        value={packages[type].deliveryDays} onChange={(e) => handlePackageChange(type, e)} />
                    </div>
                    <div>
                      <label className="label">Revisions</label>
                      <input name="revisions" type="number" min={0} max={20} className="input" placeholder="1"
                        value={packages[type].revisions} onChange={(e) => handlePackageChange(type, e)} />
                    </div>
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <input name="description" className="input" placeholder="Brief package description"
                      value={packages[type].description} onChange={(e) => handlePackageChange(type, e)} />
                  </div>

                  <div>
                    <label className="label">Features (comma-separated)</label>
                    <input name="features" className="input" placeholder="Responsive design, SEO, Contact form"
                      value={packages[type].features} onChange={(e) => handlePackageChange(type, e)} />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddPackage(type)}
                    disabled={loading || addedPackages.includes(type)}
                    className={addedPackages.includes(type) ? 'btn-secondary w-full' : 'btn-primary w-full'}
                  >
                    {addedPackages.includes(type) ? `✓ ${type} package added` : `Add ${type} package`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmitGig}
              disabled={submitting || addedPackages.length === 0}
              className="btn-primary flex-1"
            >
              {submitting ? 'Submitting…' : `Submit for Review (${addedPackages.length} package${addedPackages.length !== 1 ? 's' : ''} added)`}
            </button>
            <button onClick={() => navigate('/my-gigs')} className="btn-secondary flex-1">
              Save & Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

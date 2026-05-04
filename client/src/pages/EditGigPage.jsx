import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  updateGigApi, submitGigApi, getCategoriesApi,
  getGigPackagesApi, addGigPackageApi, updateGigPackageApi, deleteGigPackageApi, getGigByIdApi,
} from '../api/gigs';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const PACKAGE_TYPES = ['basic', 'standard', 'premium'];
const emptyNewPkg = { type: 'basic', name: '', description: '', price: '', deliveryDays: '', revisions: '1', features: '' };

function PackageRow({ pkg, onDelete, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: pkg.name,
    description: pkg.description || '',
    price: String(pkg.price),
    deliveryDays: String(pkg.deliveryDays),
    revisions: String(pkg.revisions ?? 1),
    features: (pkg.features || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const features = form.features ? form.features.split(',').map((f) => f.trim()).filter(Boolean) : [];
      const updated = await onSave(pkg._id, {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        deliveryDays: Number(form.deliveryDays),
        revisions: Number(form.revisions) || 1,
        features,
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(pkg._id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="badge bg-gray-100 text-gray-600 capitalize">{pkg.type}</span>
            <span className="font-medium text-sm text-gray-900">{pkg.name}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            ${pkg.price} · {pkg.deliveryDays}d delivery · {pkg.revisions ?? 1} revision{pkg.revisions !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger text-xs px-3 py-1.5">
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="p-4 bg-gray-50 rounded-xl border border-brand-200 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="badge bg-brand-100 text-brand-700 capitalize">{pkg.type}</span>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
      {error && <Alert message={error} />}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name *</label>
          <input name="name" className="input" required value={form.name} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Price ($) *</label>
          <input name="price" type="number" min={1} max={10000} className="input" required value={form.price} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Delivery Days *</label>
          <input name="deliveryDays" type="number" min={1} max={365} className="input" required value={form.deliveryDays} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Revisions</label>
          <input name="revisions" type="number" min={0} max={20} className="input" value={form.revisions} onChange={handleChange} />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <input name="description" className="input" placeholder="Brief description" value={form.description} onChange={handleChange} />
      </div>
      <div>
        <label className="label">Features (comma-separated)</label>
        <input name="features" className="input" placeholder="Responsive design, SEO" value={form.features} onChange={handleChange} />
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
        {saving ? 'Saving…' : 'Save Package'}
      </button>
    </form>
  );
}

export default function EditGigPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gigStatus, setGigStatus] = useState('');

  const [gigForm, setGigForm] = useState({ category: '', title: '', description: '', tags: '' });
  const [existingPackages, setExistingPackages] = useState([]);
  const [newPackage, setNewPackage] = useState(emptyNewPkg);
  const [addingPackage, setAddingPackage] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [gigRes, catRes, pkgRes] = await Promise.all([
          getGigByIdApi(id),
          getCategoriesApi(),
          getGigPackagesApi(id),
        ]);

        const gig = gigRes.data.gig;
        if (!gig) { setError('Gig not found.'); setLoading(false); return; }
        if (!['draft', 'rejected'].includes(gig.status)) {
          setError(`This gig cannot be edited (status: ${gig.status}).`);
          setLoading(false);
          return;
        }

        setGigStatus(gig.status);
        setGigForm({
          category: gig.category?._id || gig.category || '',
          title: gig.title,
          description: gig.description,
          tags: (gig.tags || []).join(', '),
        });
        setCategories(catRes.data.categories);
        setExistingPackages(pkgRes.data.packages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleGigChange = (e) => setGigForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handlePkgChange = (e) => setNewPackage((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveGig = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const tags = gigForm.tags ? gigForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      await updateGigApi(id, { category: gigForm.category, title: gigForm.title, description: gigForm.description, tags });
      setSuccess('Gig details saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePackage = async (pkgId, data) => {
    const { data: res } = await updateGigPackageApi(pkgId, data);
    setExistingPackages((prev) => prev.map((p) => p._id === pkgId ? res.package : p));
    setSuccess('Package updated.');
  };

  const handleDeletePackage = async (pkgId) => {
    await deleteGigPackageApi(pkgId);
    setExistingPackages((prev) => prev.filter((p) => p._id !== pkgId));
    setSuccess('Package deleted.');
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    setError('');
    const alreadyExists = existingPackages.some((p) => p.type === newPackage.type);
    if (alreadyExists) { setError(`A ${newPackage.type} package already exists for this gig.`); return; }
    setAddingPackage(true);
    try {
      const features = newPackage.features ? newPackage.features.split(',').map((f) => f.trim()).filter(Boolean) : [];
      const { data } = await addGigPackageApi(id, {
        type: newPackage.type,
        name: newPackage.name,
        description: newPackage.description || undefined,
        price: Number(newPackage.price),
        deliveryDays: Number(newPackage.deliveryDays),
        revisions: Number(newPackage.revisions) || 1,
        features,
      });
      setExistingPackages((p) => [...p, data.package]);
      setNewPackage(emptyNewPkg);
      setShowAddForm(false);
      setSuccess('Package added.');
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingPackage(false);
    }
  };

  const handleSubmitGig = async () => {
    if (existingPackages.length === 0) { setError('Add at least one package before submitting.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await submitGigApi(id);
      setSuccess('Gig submitted for review! Redirecting…');
      setTimeout(() => navigate('/my-gigs'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    document.title = 'Edit Gig — GigMarket';
    return () => { document.title = 'GigMarket'; };
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const availableTypes = PACKAGE_TYPES.filter((t) => !existingPackages.some((p) => p.type === t));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/my-gigs')} className="text-gray-400 hover:text-gray-600 text-sm">← My Gigs</button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Gig</h1>
        {gigStatus === 'rejected' && (
          <span className="badge bg-red-100 text-red-600">Rejected — fix and resubmit</span>
        )}
      </div>

      {error && <div className="mb-4"><Alert message={error} /></div>}
      {success && <div className="mb-4"><Alert message={success} variant="success" /></div>}

      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Gig Details</h2>
        <form onSubmit={handleSaveGig} className="space-y-5">
          <div>
            <label className="label">Category *</label>
            <select name="category" value={gigForm.category} onChange={handleGigChange} className="input" required>
              <option value="">Select a category…</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Title *</label>
            <input name="title" type="text" required className="input"
              value={gigForm.title} onChange={handleGigChange} minLength={10} maxLength={100} />
            <p className="text-xs text-gray-400 mt-1">{gigForm.title.length} / 100</p>
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea name="description" required rows={6} className="input resize-none"
              value={gigForm.description} onChange={handleGigChange} minLength={50} maxLength={3000} />
            <p className="text-xs text-gray-400 mt-1">{gigForm.description.length} / 3000</p>
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input name="tags" type="text" className="input"
              placeholder="e.g. react, nodejs, fullstack"
              value={gigForm.tags} onChange={handleGigChange} />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Save Details'}
          </button>
        </form>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Packages</h2>
          {availableTypes.length > 0 && (
            <button onClick={() => setShowAddForm((v) => !v)} className="btn-secondary text-xs px-3 py-1.5">
              {showAddForm ? 'Cancel' : '+ Add Package'}
            </button>
          )}
        </div>

        {existingPackages.length === 0 && !showAddForm && (
          <p className="text-sm text-gray-400 mb-3">No packages yet. Add at least one before submitting.</p>
        )}

        <div className="space-y-3">
          {existingPackages.map((pkg) => (
            <PackageRow
              key={pkg._id}
              pkg={pkg}
              onSave={handleUpdatePackage}
              onDelete={handleDeletePackage}
            />
          ))}
        </div>

        {showAddForm && availableTypes.length > 0 && (
          <form onSubmit={handleAddPackage} className="mt-4 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-medium text-gray-800 text-sm">New Package</h3>
            <div>
              <label className="label">Package Type</label>
              <select name="type" value={newPackage.type} onChange={handlePkgChange} className="input">
                {availableTypes.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name *</label>
                <input name="name" className="input" placeholder="Package name" required value={newPackage.name} onChange={handlePkgChange} />
              </div>
              <div>
                <label className="label">Price ($) *</label>
                <input name="price" type="number" min={1} max={10000} className="input" placeholder="50" required value={newPackage.price} onChange={handlePkgChange} />
              </div>
              <div>
                <label className="label">Delivery Days *</label>
                <input name="deliveryDays" type="number" min={1} max={365} className="input" placeholder="3" required value={newPackage.deliveryDays} onChange={handlePkgChange} />
              </div>
              <div>
                <label className="label">Revisions</label>
                <input name="revisions" type="number" min={0} max={20} className="input" placeholder="1" value={newPackage.revisions} onChange={handlePkgChange} />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <input name="description" className="input" placeholder="Brief package description" value={newPackage.description} onChange={handlePkgChange} />
            </div>
            <div>
              <label className="label">Features (comma-separated)</label>
              <input name="features" className="input" placeholder="Responsive design, SEO" value={newPackage.features} onChange={handlePkgChange} />
            </div>
            <button type="submit" disabled={addingPackage} className="btn-primary w-full text-sm">
              {addingPackage ? 'Adding…' : 'Add Package'}
            </button>
          </form>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmitGig}
          disabled={submitting || existingPackages.length === 0}
          className="btn-primary flex-1"
        >
          {submitting ? 'Submitting…' : 'Submit for Review'}
        </button>
        <button onClick={() => navigate('/my-gigs')} className="btn-secondary flex-1">
          Save & Exit
        </button>
      </div>
    </div>
  );
}

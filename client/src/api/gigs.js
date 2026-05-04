import api from './axios';

export const getActiveGigsApi   = (params)            => api.get('/gigs', { params });
export const getGigBySlugApi    = (slug)               => api.get(`/gigs/${slug}`);
export const getGigByIdApi      = (id)                 => api.get(`/gigs/id/${id}`);
export const getCategoriesApi   = ()                   => api.get('/categories');
export const createGigApi       = (data)               => api.post('/gigs', data);
export const updateGigApi       = (id, data)           => api.patch(`/gigs/${id}`, data);
export const submitGigApi       = (id)                 => api.patch(`/gigs/${id}/submit`);
export const moderateGigApi     = (id, action, note)   => api.patch(`/gigs/${id}/moderate`, { action, note });
export const activateGigApi     = (id)                 => api.patch(`/gigs/${id}/activate`);
export const getProviderGigsApi = (params)             => api.get('/gigs/provider/mine', { params });
export const addGigPackageApi    = (gigId, data)        => api.post(`/gig-packages/${gigId}`, data);
export const updateGigPackageApi = (id, data)           => api.patch(`/gig-packages/package/${id}`, data);
export const deleteGigPackageApi = (id)                 => api.delete(`/gig-packages/package/${id}`);
export const getGigPackagesApi   = (gigId)              => api.get(`/gig-packages/${gigId}`);

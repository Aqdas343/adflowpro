import api from './axios';

export const placeOrderApi         = (data)           => api.post('/orders', data);
export const getMyOrdersApi        = (params)         => api.get('/orders/client', { params });
export const getProviderOrdersApi  = (params)         => api.get('/orders/provider', { params });
export const startOrderApi         = (id)             => api.patch(`/orders/${id}/start`);
export const deliverOrderApi       = (id)             => api.patch(`/orders/${id}/deliver`);
export const completeOrderApi      = (id)             => api.patch(`/orders/${id}/complete`);
export const requestRevisionApi    = (id, data)       => api.patch(`/orders/${id}/revision`, data);
export const getOrderHistoryApi    = (id)             => api.get(`/orders/${id}/history`);

export const submitPaymentApi      = (orderId, data)  => api.post(`/payments/${orderId}`, data);
export const verifyPaymentApi      = (id, data)       => api.patch(`/payments/${id}/verify`, data);
export const getPendingPaymentsApi = ()               => api.get('/payments/pending');

export const submitReviewApi       = (orderId, data)  => api.post(`/reviews/${orderId}`, data);

// ShopSphere API Client
const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = `${API_HOST}/api`;

/**
 * Handle API responses safely
 */
async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export async function fetchCategories() {
  const res = await fetch(`${BASE_URL}/products/categories`);
  const data = await handleResponse(res);
  return data.categories || [];
}

export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.minPrice) query.append('minPrice', params.minPrice);
  if (params.maxPrice) query.append('maxPrice', params.maxPrice);
  if (params.featured) query.append('featured', 'true');
  if (params.trending) query.append('trending', 'true');
  if (params.limit) query.append('limit', params.limit);

  const res = await fetch(`${BASE_URL}/products?${query.toString()}`);
  const data = await handleResponse(res);
  return data.products || [];
}

export async function fetchProductById(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  const data = await handleResponse(res);
  return data.product;
}

export async function searchProducts(searchTerm, filters = {}) {
  const query = new URLSearchParams();
  if (searchTerm) query.append('q', searchTerm);
  if (filters.category) query.append('category', filters.category);
  if (filters.minPrice) query.append('minPrice', filters.minPrice);
  if (filters.maxPrice) query.append('maxPrice', filters.maxPrice);
  if (filters.limit) query.append('limit', filters.limit || 20);

  const res = await fetch(`${BASE_URL}/search?${query.toString()}`);
  return await handleResponse(res);
}

export async function placeOrder(orderPayload) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderPayload)
  });
  return await handleResponse(res);
}

export async function fetchOrderById(id) {
  const res = await fetch(`${BASE_URL}/orders/${id}`);
  const data = await handleResponse(res);
  return data.order;
}

export async function fetchAdminStats() {
  const res = await fetch(`${BASE_URL}/admin/stats`, {
    headers: {
      'x-admin-key': 'shopsphere_admin_secret_2026'
    }
  });
  return await handleResponse(res);
}

export async function fetchServicesHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return await handleResponse(res);
}

export async function fetchOpenSearchHealth() {
  const res = await fetch(`${BASE_URL}/health/opensearch`);
  return await handleResponse(res);
}

export async function triggerResetData() {
  const res = await fetch(`${BASE_URL}/admin/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': 'shopsphere_admin_secret_2026'
    }
  });
  return await handleResponse(res);
}

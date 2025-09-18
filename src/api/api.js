import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL + '/api';

const API = axios.create({
    baseURL: API_BASE_URL, 
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = (credentials) => API.post('/auth/login', credentials);
export const forgotPassword = (email) => API.post('/auth/password/forgot', { email });
export const resetPassword = (token, password) => API.post(`/auth/password/reset/${token}`, { password });


export const getUser = () => API.get('/auth/me');
export const logout = () => API.post('/auth/logout');
export const updateProfile = (profile) => API.put('/auth/profile', profile);
export const updatePassword = (password) => API.put('/auth/password', password);
export const updatePhone = (phone) => API.put('/auth/phone', phone);


export const getAllUsers = () => API.get('/admin/users');
export const getUserById = (id) => API.get(`/admin/users/${id}`);
export const createUser = (user) => API.post('/admin/users', user);
export const updateUser = (id, user) => API.put(`/admin/users/${id}`, user);
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);

export const getAllRoles = () => API.get('/admin/roles');
export const createRole = (role) => API.post('/admin/roles', role);
export const updateRole = (id, role) => API.put(`/admin/roles/${id}`, role);
export const deleteRole = (id) => API.delete(`/admin/roles/${id}`);

export const getStats = () => API.get('/admin/stats');

export const getAllTables = () => API.get('/manager/tables');
export const createTable = (table) => API.post('/manager/tables', table);
export const updateTable = (id, table) => API.post(`/manager/tables/${id}`, table);
export const deleteTable = (id) => API.delete(`/manager/tables/${id}`);

export const getAllReservations = () => API.get('/manager/reservations');
export const updateReservationStatus = (id, status) => API.put(`/manager/reservations/${id}/status`, { status });

export const getAllCategories = () => API.get('/manager/categories');
export const createCategory = (category) => API.post('/manager/categories', category);
export const updateCategory = (id, category) => API.put(`/manager/categories/${id}`, category);
export const deleteCategory = (id) => API.delete(`/manager/categories/${id}`);

export const getAllDishes = () => API.get('/manager/dishes');
export const createDish = (dish) => API.post('/manager/dishes', dish);
export const updateDish = (id, dish) => API.post(`/manager/dishes/${id}`, dish);
export const deleteDish = (id) => API.delete(`/manager/dishes/${id}`);

// Discount management
export const getDishesWithDiscounts = () => API.get('/manager/dishes/discounts');
export const applyDishDiscount = (dishId, discountData) => API.post(`/manager/dishes/${dishId}/discount`, discountData);
export const removeDishDiscount = (dishId) => API.delete(`/manager/dishes/${dishId}/discount`);

export const getAllOrders = () => API.get('/cashier/orders');
export const getOrdersNeedingAttention = () => API.get('/cashier/orders/needing-attention');
export const getTodaySummary = () => API.get('/cashier/orders/today-summary');
export const getOrderById = (id) => API.get(`/cashier/orders/${id}`);
export const updateOrderStatus = (id, status) => API.put(`/cashier/orders/${id}/status`, { status });
export const updateOrderItemStatus = (orderId, itemId, status) => API.put(`/cashier/orders/${orderId}/items/${itemId}/status`, { status });
export const markOrderAsDelivered = (id) => API.put(`/cashier/orders/${id}/delivered`);
export const cancelOrder = (id) => API.put(`/cashier/orders/${id}/cancel`);
export const getOrdersByTable = (tableId) => API.get(`/cashier/orders/table/${tableId}`);
export const getOrdersByUser = (userId) => API.get(`/cashier/orders/user/${userId}`);

export const getRecentActivities = (params = {}) => API.get('/activity/recent', { params });


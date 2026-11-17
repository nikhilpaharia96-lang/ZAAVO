// ═══════════════════════════════════════════════════════════
// ZAAVO — Redux Store (RTK)
// src/store/index.js  — import this as the root store
// ═══════════════════════════════════════════════════════════

import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ─── Axios Instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zaavo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('zaavo_token');
      localStorage.removeItem('zaavo_refresh');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export { api };

// ═══════════════════════════════════════════════════════════
// AUTH SLICE
// ═══════════════════════════════════════════════════════════

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('zaavo_token', res.data.data.accessToken);
    localStorage.setItem('zaavo_refresh', res.data.data.refreshToken);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('zaavo_token', res.data.data.accessToken);
    localStorage.setItem('zaavo_refresh', res.data.data.refreshToken);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout'); } catch (_) {}
  localStorage.removeItem('zaavo_token');
  localStorage.removeItem('zaavo_refresh');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,
    token:       localStorage.getItem('zaavo_token') || null,
    isLoggedIn:  !!localStorage.getItem('zaavo_token'),
    loading:     false,
    error:       null,
    initialized: false,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser:    (state, action) => { state.user = action.payload; },
    updateUser: (state, action) => { state.user = { ...state.user, ...action.payload }; },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending,    (s) => { s.loading = true; s.error = null; });
    builder.addCase(loginUser.fulfilled,  (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.accessToken; s.isLoggedIn = true; });
    builder.addCase(loginUser.rejected,   (s, a) => { s.loading = false; s.error = a.payload; });
    // Register
    builder.addCase(registerUser.pending,   (s) => { s.loading = true; s.error = null; });
    builder.addCase(registerUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.accessToken; s.isLoggedIn = true; });
    builder.addCase(registerUser.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
    // Me
    builder.addCase(fetchMe.pending,   (s) => { s.loading = true; });
    builder.addCase(fetchMe.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.isLoggedIn = true; s.initialized = true; });
    builder.addCase(fetchMe.rejected,  (s) => { s.loading = false; s.isLoggedIn = false; s.initialized = true; s.token = null; });
    // Logout
    builder.addCase(logoutUser.fulfilled, (s) => { s.user = null; s.token = null; s.isLoggedIn = false; });
  },
});

export const { clearError, setUser, updateUser } = authSlice.actions;

// ═══════════════════════════════════════════════════════════
// CART SLICE
// ═══════════════════════════════════════════════════════════

const getStoredCart = () => {
  try { return JSON.parse(localStorage.getItem('zaavo_cart') || '[]'); }
  catch { return []; }
};

const saveCart = (items) => {
  localStorage.setItem('zaavo_cart', JSON.stringify(items));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items:            getStoredCart(),
    restaurantId:     null,
    restaurantName:   null,
    appliedCoupon:    null,
    couponDiscount:   0,
    deliveryAddress:  null,
    paymentMethod:    'upi',
    specialNotes:     '',
  },
  reducers: {
    addToCart: (state, action) => {
      const { food, quantity = 1, restaurantId, restaurantName } = action.payload;

      // Warn if different restaurant
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
        state.appliedCoupon  = null;
        state.couponDiscount = 0;
      }

      state.restaurantId   = restaurantId;
      state.restaurantName = restaurantName;

      const existing = state.items.find(i => i._id === food._id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ ...food, quantity });
      }

      saveCart(state.items);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(i => i._id !== action.payload);
      if (state.items.length === 0) { state.restaurantId = null; state.restaurantName = null; }
      saveCart(state.items);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter(i => i._id !== id);
      } else {
        const item = state.items.find(i => i._id === id);
        if (item) item.quantity = quantity;
      }
      if (state.items.length === 0) { state.restaurantId = null; state.restaurantName = null; }
      saveCart(state.items);
    },

    clearCart: (state) => {
      state.items = []; state.restaurantId = null; state.restaurantName = null;
      state.appliedCoupon = null; state.couponDiscount = 0;
      localStorage.removeItem('zaavo_cart');
    },

    applyCoupon: (state, action) => {
      state.appliedCoupon  = action.payload.coupon;
      state.couponDiscount = action.payload.discount;
    },

    removeCoupon: (state) => {
      state.appliedCoupon  = null;
      state.couponDiscount = 0;
    },

    setDeliveryAddress: (state, action) => { state.deliveryAddress = action.payload; },
    setPaymentMethod:   (state, action) => { state.paymentMethod   = action.payload; },
    setSpecialNotes:    (state, action) => { state.specialNotes    = action.payload; },
  },
});

export const {
  addToCart, removeFromCart, updateQuantity, clearCart,
  applyCoupon, removeCoupon, setDeliveryAddress, setPaymentMethod, setSpecialNotes,
} = cartSlice.actions;

// Cart selectors
export const selectCartItems        = (state) => state.cart.items;
export const selectCartCount        = (state) => state.cart.items.reduce((s, i) => s + i.quantity, 0);
export const selectCartSubtotal     = (state) => state.cart.items.reduce((s, i) => s + (i.price * i.quantity), 0);
export const selectCartDeliveryFee  = (state) => selectCartSubtotal(state) >= 199 ? 0 : 30;
export const selectCartTotal        = (state) => {
  const sub      = selectCartSubtotal(state);
  const delivery = selectCartDeliveryFee(state);
  const coupon   = state.cart.couponDiscount;
  const tax      = Math.round(sub * 0.05);
  return Math.max(0, sub + delivery + tax - coupon);
};

// ═══════════════════════════════════════════════════════════
// RESTAURANT SLICE
// ═══════════════════════════════════════════════════════════

export const fetchRestaurants = createAsyncThunk('restaurants/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/restaurants', { params });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchRestaurantById = createAsyncThunk('restaurants/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const [restaurantRes, menuRes] = await Promise.all([
      api.get(`/restaurants/${id}`),
      api.get(`/restaurants/${id}/menu`),
    ]);
    return { restaurant: restaurantRes.data.data.restaurant, menu: menuRes.data.data };
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchFoods = createAsyncThunk('restaurants/fetchFoods', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/foods', { params });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState: {
    list:        [],
    selected:    null,
    menu:        { foods: [], grouped: {} },
    foods:       [],
    total:       0,
    loading:     false,
    error:       null,
    filters:     { search: '', cuisine: '', sort: '-rating' },
  },
  reducers: {
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    clearSelected: (state) => { state.selected = null; state.menu = { foods: [], grouped: {} }; },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchRestaurants.pending,   (s) => { s.loading = true; s.error = null; });
    builder.addCase(fetchRestaurants.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.restaurants; s.total = a.payload.total; });
    builder.addCase(fetchRestaurants.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });

    builder.addCase(fetchRestaurantById.pending,   (s) => { s.loading = true; });
    builder.addCase(fetchRestaurantById.fulfilled, (s, a) => { s.loading = false; s.selected = a.payload.restaurant; s.menu = a.payload.menu; });
    builder.addCase(fetchRestaurantById.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });

    builder.addCase(fetchFoods.pending,   (s) => { s.loading = true; });
    builder.addCase(fetchFoods.fulfilled, (s, a) => { s.loading = false; s.foods = a.payload.foods; });
    builder.addCase(fetchFoods.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { setFilters, clearSelected } = restaurantSlice.actions;

// ═══════════════════════════════════════════════════════════
// ORDER SLICE
// ═══════════════════════════════════════════════════════════

export const placeOrder = createAsyncThunk('orders/place', async (orderData, { rejectWithValue }) => {
  try {
    const res = await api.post('/orders', orderData);
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Order failed'); }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMine', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/orders/my', { params });
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchOrderById = createAsyncThunk('orders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/orders/${id}`);
    return res.data.data.order;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    list:    [],
    current: null,
    loading: false,
    placing: false,
    error:   null,
    total:   0,
  },
  reducers: {
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      if (state.current?._id === orderId) state.current.status = status;
      const idx = state.list.findIndex(o => o._id === orderId);
      if (idx !== -1) state.list[idx].status = status;
    },
    clearCurrentOrder: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder.addCase(placeOrder.pending,   (s) => { s.placing = true; s.error = null; });
    builder.addCase(placeOrder.fulfilled, (s, a) => { s.placing = false; s.current = a.payload.order; });
    builder.addCase(placeOrder.rejected,  (s, a) => { s.placing = false; s.error = a.payload; });

    builder.addCase(fetchMyOrders.pending,   (s) => { s.loading = true; });
    builder.addCase(fetchMyOrders.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.orders; s.total = a.payload.total; });
    builder.addCase(fetchMyOrders.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });

    builder.addCase(fetchOrderById.pending,   (s) => { s.loading = true; });
    builder.addCase(fetchOrderById.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; });
    builder.addCase(fetchOrderById.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { updateOrderStatus, clearCurrentOrder } = orderSlice.actions;

// ═══════════════════════════════════════════════════════════
// UI SLICE (modals, toasts, theme)
// ═══════════════════════════════════════════════════════════

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme:          'dark',
    selectedFood:   null,
    foodModalOpen:  false,
    searchOpen:     false,
    sidebarOpen:    true,
    notifications:  [],
    unreadCount:    0,
  },
  reducers: {
    openFoodModal:   (state, action) => { state.selectedFood = action.payload; state.foodModalOpen = true; },
    closeFoodModal:  (state) => { state.foodModalOpen = false; state.selectedFood = null; },
    toggleSearch:    (state) => { state.searchOpen = !state.searchOpen; },
    closeSearch:     (state) => { state.searchOpen = false; },
    toggleSidebar:   (state) => { state.sidebarOpen = !state.sidebarOpen; },
    toggleTheme:     (state) => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
      if (state.notifications.length > 50) state.notifications.pop();
    },
    markNotificationsRead: (state) => { state.unreadCount = 0; },
  },
});

export const {
  openFoodModal, closeFoodModal, toggleSearch, closeSearch,
  toggleSidebar, toggleTheme, addNotification, markNotificationsRead,
} = uiSlice.actions;

// ═══════════════════════════════════════════════════════════
// WISHLIST SLICE
// ═══════════════════════════════════════════════════════════

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: JSON.parse(localStorage.getItem('zaavo_wishlist') || '[]'),
  },
  reducers: {
    toggleWishlist: (state, action) => {
      const idx = state.items.findIndex(i => i._id === action.payload._id);
      if (idx === -1) {
        state.items.push(action.payload);
      } else {
        state.items.splice(idx, 1);
      }
      localStorage.setItem('zaavo_wishlist', JSON.stringify(state.items));
    },
    clearWishlist: (state) => {
      state.items = [];
      localStorage.removeItem('zaavo_wishlist');
    },
  },
});

export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;
export const selectIsWishlisted = (id) => (state) => state.wishlist.items.some(i => i._id === id);

// ═══════════════════════════════════════════════════════════
// STORE CONFIGURATION
// ═══════════════════════════════════════════════════════════

const store = configureStore({
  reducer: {
    auth:        authSlice.reducer,
    cart:        cartSlice.reducer,
    restaurants: restaurantSlice.reducer,
    orders:      orderSlice.reducer,
    ui:          uiSlice.reducer,
    wishlist:    wishlistSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export default store;

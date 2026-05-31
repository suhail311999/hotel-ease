// data.js - State Management & Database REST API Integration (Synchronous)
(function () {
  'use strict';

  window.HotelEase = window.HotelEase || {};

  const CURRENT_USER_KEY = 'hotelease_current_user';

  // Helper to load current user from browser cache
  function getCachedUser() {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // Helper to save current user to browser cache
  function setCachedUser(user) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  // Helper to make synchronous HTTP requests
  function makeSyncRequest(method, url, data = null) {
    const xhr = new XMLHttpRequest();
    // Synchronous request (3rd param is false)
    xhr.open(method, url, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    try {
      xhr.send(data ? JSON.stringify(data) : null);
      if (xhr.status >= 200 && xhr.status < 300) {
        return JSON.parse(xhr.responseText);
      } else {
        console.error('Request failed:', xhr.status, xhr.statusText);
        try {
          return JSON.parse(xhr.responseText);
        } catch (e) {
          return { success: false, message: xhr.statusText || 'Request failed' };
        }
      }
    } catch (e) {
      console.error('Network error during sync XHR:', e);
      return { success: false, message: 'Server connection failed' };
    }
  }

  // Exposed DB Methods
  const db = {
    // Auth operations
    login(email, password) {
      const res = makeSyncRequest('POST', '/api/auth/login', { email, password });
      if (res && res.success) {
        setCachedUser(res.user);
      }
      return res;
    },

    register(name, email, password, role) {
      return makeSyncRequest('POST', '/api/auth/register', { name, email, password, role });
    },

    logout() {
      setCachedUser(null);
    },

    getCurrentUser() {
      return getCachedUser();
    },

    updateUserBalance(userId, newBalance) {
      const res = makeSyncRequest('PUT', `/api/auth/users/${userId}/balance`, { balance: newBalance });
      if (res && res.success) {
        const user = getCachedUser();
        if (user && user.id === userId) {
          user.balance = res.balance;
          setCachedUser(user);
        }
        return true;
      }
      return false;
    },

    // Hotel operations
    getHotels(filters = {}) {
      const params = new URLSearchParams();
      if (filters.onlyApproved) params.append('onlyApproved', 'true');
      if (filters.ownerId) params.append('ownerId', filters.ownerId);
      if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.amenities && filters.amenities.length > 0) {
        params.append('amenities', filters.amenities.join(','));
      }
      
      const url = '/api/hotels?' + params.toString();
      return makeSyncRequest('GET', url) || [];
    },

    getHotelById(id) {
      return makeSyncRequest('GET', `/api/hotels/${id}`);
    },

    addHotel(hotelData) {
      return makeSyncRequest('POST', '/api/hotels', hotelData);
    },

    updateHotelRooms(hotelId, roomDataArray) {
      const res = makeSyncRequest('PUT', `/api/hotels/${hotelId}/rooms`, { rooms: roomDataArray });
      return !!(res && res.success);
    },

    // Booking operations
    createBooking(bookingDetails) {
      const res = makeSyncRequest('POST', '/api/bookings', bookingDetails);
      if (res && res.success) {
        const user = getCachedUser();
        if (user && user.id === bookingDetails.customerId) {
          user.balance -= bookingDetails.totalCost;
          setCachedUser(user);
        }
      }
      return res;
    },

    cancelBooking(bookingId) {
      const res = makeSyncRequest('POST', `/api/bookings/${bookingId}/cancel`);
      if (res && res.success) {
        const user = getCachedUser();
        if (user) {
          user.balance += res.refundAmount;
          setCachedUser(user);
        }
      }
      return res;
    },

    updateBookingStatus(bookingId, status) {
      const res = makeSyncRequest('PUT', `/api/bookings/${bookingId}/status`, { status });
      return !!(res && res.success);
    },

    getBookings(filters = {}) {
      const params = new URLSearchParams();
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.ownerId) params.append('ownerId', filters.ownerId);
      
      return makeSyncRequest('GET', `/api/bookings?` + params.toString()) || [];
    },

    // Review operations
    addReview(reviewData) {
      return makeSyncRequest('POST', '/api/reviews', reviewData);
    },

    deleteReview(reviewId) {
      const res = makeSyncRequest('DELETE', `/api/reviews/${reviewId}`);
      return !!(res && res.success);
    },

    getReviews(filters = {}) {
      const params = new URLSearchParams();
      if (filters.hotelId) params.append('hotelId', filters.hotelId);
      
      return makeSyncRequest('GET', `/api/reviews?` + params.toString()) || [];
    },

    // Admin operations
    getUsers() {
      return makeSyncRequest('GET', '/api/admin/users') || [];
    },

    toggleUserStatus(userId) {
      const res = makeSyncRequest('POST', `/api/admin/users/${userId}/toggle-status`);
      return res ? res.active : false;
    },

    changeUserRole(userId, newRole) {
      const res = makeSyncRequest('POST', `/api/admin/users/${userId}/role`, { role: newRole });
      return !!(res && res.success);
    },

    getPendingHotels() {
      return makeSyncRequest('GET', '/api/admin/hotels/pending') || [];
    },

    approveHotel(hotelId) {
      const res = makeSyncRequest('POST', `/api/admin/hotels/${hotelId}/approve`);
      return !!(res && res.success);
    },

    rejectHotel(hotelId) {
      const res = makeSyncRequest('POST', `/api/admin/hotels/${hotelId}/reject`);
      return !!(res && res.success);
    },

    getAdminStats() {
      return makeSyncRequest('GET', '/api/admin/stats');
    },

    getOwnerStats(ownerId) {
      return makeSyncRequest('GET', `/api/owner/${ownerId}/stats`);
    }
  };

  window.HotelEase.db = db;
})();

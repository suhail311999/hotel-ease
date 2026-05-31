// admin.js - Platform Administrator Module
(function () {
  'use strict';

  window.HotelEase = window.HotelEase || {};
  window.HotelEase.admin = window.HotelEase.admin || {};

  const db = window.HotelEase.db;
  const ui = window.HotelEase.ui;

  let activeTab = 'approvals'; // approvals, users, reviews

  // ----------------------------------------------------
  // VIEW RENDERER
  // ----------------------------------------------------
  function renderDashboardView(container) {
    const user = db.getCurrentUser();
    if (!user || user.role !== 'admin') {
      container.innerHTML = `
        <div class="container" style="padding: 80px 0;">
          <div class="empty-state">
            <i class="fa-solid fa-lock"></i>
            <h4>Access Denied</h4>
            <p>You must be logged in as an Administrator to view this dashboard.</p>
            <button class="btn btn-primary" onclick="HotelEase.ui.openModal('modal-auth')">Log In Now</button>
          </div>
        </div>
      `;
      return;
    }

    const stats = db.getAdminStats();

    container.innerHTML = `
      <section class="dashboard-layout container">
        <div class="dashboard-header">
          <div>
            <h1 class="font-serif">Administrator Panel</h1>
            <p class="text-muted">Perform listing audits, deactivate accounts, assign credentials, and moderate customer feedback.</p>
          </div>
        </div>

        <!-- Global Platform Metrics -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--success); background: rgba(16, 185, 129, 0.1);"><i class="fa-solid fa-coins"></i></div>
            <div class="stat-info">
              <span class="stat-value">${ui.formatCurrency(stats.totalRevenue)}</span>
              <span class="stat-label">Platform Volume</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--primary); background: rgba(197, 168, 128, 0.1);"><i class="fa-solid fa-users"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.totalUsers}</span>
              <span class="stat-label font-sans">Registered Users</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--warning); background: rgba(245, 158, 11, 0.1);"><i class="fa-solid fa-clock"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.pendingHotels}</span>
              <span class="stat-label">Pending Approval</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--info); background: rgba(14, 165, 233, 0.1);"><i class="fa-solid fa-calendar-check"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.totalBookings}</span>
              <span class="stat-label">Total Reservations</span>
            </div>
          </div>
        </div>

        <!-- Section Navigation Tabs -->
        <div class="tabs-nav">
          <button class="tab-btn ${activeTab === 'approvals' ? 'active' : ''}" id="admin-tab-approvals" onclick="HotelEase.admin.switchTab('approvals')">Hotel Approvals (${stats.pendingHotels})</button>
          <button class="tab-btn ${activeTab === 'users' ? 'active' : ''}" id="admin-tab-users" onclick="HotelEase.admin.switchTab('users')">User Accounts</button>
          <button class="tab-btn ${activeTab === 'reviews' ? 'active' : ''}" id="admin-tab-reviews" onclick="HotelEase.admin.switchTab('reviews')">Review Moderation</button>
        </div>

        <!-- Dynamic Listings Content -->
        <div id="admin-tab-content">
          <!-- Populated by helper -->
        </div>
      </section>
    `;

    renderTabContent();
  }

  // Switch between tab sections
  function switchTab(tabName) {
    activeTab = tabName;
    const container = document.getElementById('app-view');
    if (container) {
      renderDashboardView(container);
    }
  }

  // Render contents of tab
  function renderTabContent() {
    const content = document.getElementById('admin-tab-content');
    if (!content) return;

    if (activeTab === 'approvals') {
      const pendingHotels = db.getPendingHotels();

      if (pendingHotels.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-circle-check" style="color: var(--success);"></i>
            <h4>All Caught Up</h4>
            <p>No new hotel listing registrations are pending approval at this time.</p>
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px;">
          ${pendingHotels.map(hotel => `
            <div class="booking-item-card fade-in">
              <div class="booking-item-img" style="background-image: url('${hotel.imageUrl}');"></div>
              <div class="booking-item-body">
                <div class="booking-item-info">
                  <span class="badge badge-warning" style="margin-bottom: 8px;">Awaiting Review</span>
                  <h4>${hotel.name}</h4>
                  <p class="text-muted" style="font-size: 0.85rem;"><i class="fa-solid fa-location-dot"></i> ${hotel.location}</p>
                  <p class="text-muted" style="font-size: 0.88rem; margin-top: 8px;">${hotel.description}</p>
                  <div class="booking-item-meta" style="margin-top: 14px;">
                    <span><strong>Amenities Listed:</strong> ${hotel.amenities.join(', ') || 'None'}</span>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end;">
                  <div style="display: flex; gap: 10px; margin-top: 16px;">
                    <button class="btn btn-outline btn-sm" onclick="HotelEase.admin.processApproval('${hotel.id}', false)" style="color: var(--danger); border-color: rgba(244,63,94,0.2);">
                      <i class="fa-solid fa-circle-xmark"></i> Reject Listing
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="HotelEase.admin.processApproval('${hotel.id}', true)">
                      <i class="fa-solid fa-circle-check"></i> Approve & List
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (activeTab === 'users') {
      const users = db.getUsers();

      content.innerHTML = `
        <div class="table-responsive fade-in">
          <table class="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => {
                const statusBadge = u.active 
                  ? '<span class="badge badge-success">Active</span>' 
                  : '<span class="badge badge-danger">Suspended</span>';

                const isCurrentUser = db.getCurrentUser().id === u.id;
                const toggleBtnText = u.active ? 'Suspend' : 'Activate';
                const toggleBtnClass = u.active ? 'btn-outline' : 'btn-primary';

                return `
                  <tr>
                    <td><strong>${u.id}</strong></td>
                    <td>${u.name} ${isCurrentUser ? '<span class="text-muted" style="font-size:0.75rem;">(You)</span>' : ''}</td>
                    <td>${u.email}</td>
                    <td>${ui.formatDate(u.joinedDate)}</td>
                    <td>${statusBadge}</td>
                    <td>
                      <select class="select-role-table" ${isCurrentUser ? 'disabled' : ''} 
                              onchange="HotelEase.admin.changeRole('${u.id}', this.value)">
                        <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
                        <option value="owner" ${u.role === 'owner' ? 'selected' : ''}>Hotel Owner</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrator</option>
                      </select>
                    </td>
                    <td>
                      <button class="btn ${toggleBtnClass} btn-sm" ${isCurrentUser ? 'disabled' : ''} 
                              onclick="HotelEase.admin.toggleUserStatus('${u.id}')">
                        ${toggleBtnText}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      // Reviews Tab
      const reviews = db.getReviews();

      if (reviews.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-comment-slash"></i>
            <h4>No Guest Reviews Found</h4>
            <p>No customer reviews are saved on the platform database yet.</p>
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <div class="review-moderation-list fade-in">
          ${reviews.map(r => `
            <div class="moderation-card">
              <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                  <div>
                    <strong style="color: var(--primary);">${r.hotelName}</strong>
                    <span class="text-muted" style="font-size: 0.8rem; margin-left: 10px;">by ${r.customerName}</span>
                  </div>
                  <span class="text-muted" style="font-size: 0.8rem;">${ui.formatDate(r.date)}</span>
                </div>
                <div style="margin-bottom: 8px;">
                  ${ui.renderStars(r.rating)}
                </div>
                <p class="text-muted" style="font-size: 0.92rem; font-style: italic;">"${r.comment}"</p>
              </div>
              <div>
                <button class="btn btn-outline btn-sm" onclick="HotelEase.admin.moderateReview('${r.id}')" style="color: var(--danger); border-color: rgba(244,63,94,0.2);">
                  <i class="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  // Handle hotel listings approvals
  function processApproval(hotelId, isApproved) {
    if (isApproved) {
      const success = db.approveHotel(hotelId);
      if (success) {
        ui.showToast('Hotel listing verified and published to HotelEase database.', 'success');
      }
    } else {
      if (confirm('Are you sure you want to reject and delete this registration request?')) {
        const success = db.rejectHotel(hotelId);
        if (success) {
          ui.showToast('Listing request rejected. Data removed.', 'info');
        }
      } else {
        return;
      }
    }

    // Re-render
    const container = document.getElementById('app-view');
    renderDashboardView(container);
  }

  // Toggle user suspension
  function toggleUserStatus(userId) {
    const activeState = db.toggleUserStatus(userId);
    if (activeState !== false) {
      ui.showToast(`User account status updated. Active: ${activeState}`, 'success');
      
      // Re-render
      const container = document.getElementById('app-view');
      renderDashboardView(container);
    } else {
      ui.showToast('Error modifying user account status.', 'error');
    }
  }

  // Change user role
  function changeRole(userId, newRole) {
    const success = db.changeUserRole(userId, newRole);
    if (success) {
      ui.showToast(`User role successfully changed to ${newRole}.`, 'success');
      
      // Re-render
      const container = document.getElementById('app-view');
      renderDashboardView(container);
    } else {
      ui.showToast('Error changing user account role.', 'error');
    }
  }

  // Moderated and Delete Review
  function moderateReview(reviewId) {
    if (confirm('Are you sure you want to delete this guest review from the platform database?')) {
      const success = db.deleteReview(reviewId);
      if (success) {
        ui.showToast('Review has been deleted.', 'info');
        
        // Re-render
        const container = document.getElementById('app-view');
        renderDashboardView(container);
      } else {
        ui.showToast('Failed to delete review.', 'error');
      }
    }
  }

  // Export
  window.HotelEase.admin = {
    renderDashboardView,
    switchTab,
    processApproval,
    toggleUserStatus,
    changeRole,
    moderateReview
  };
})();

// owner.js - Hotel Owner Module
(function () {
  'use strict';

  window.HotelEase = window.HotelEase || {};
  window.HotelEase.owner = window.HotelEase.owner || {};

  const db = window.HotelEase.db;
  const ui = window.HotelEase.ui;

  let activeTab = 'hotels'; // hotels or bookings
  let currentConfiguringHotelId = null;

  // ----------------------------------------------------
  // VIEW RENDERER
  // ----------------------------------------------------
  function renderDashboardView(container) {
    const user = db.getCurrentUser();
    if (!user || user.role !== 'owner') {
      container.innerHTML = `
        <div class="container" style="padding: 80px 0;">
          <div class="empty-state">
            <i class="fa-solid fa-lock"></i>
            <h4>Access Denied</h4>
            <p>You must be logged in as an Owner to view this dashboard.</p>
            <button class="btn btn-primary" onclick="HotelEase.ui.openModal('modal-auth')">Log In Now</button>
          </div>
        </div>
      `;
      return;
    }

    const stats = db.getOwnerStats(user.id);

    container.innerHTML = `
      <section class="dashboard-layout container">
        <div class="dashboard-header">
          <div>
            <h1 class="font-serif">Owner Dashboard</h1>
            <p class="text-muted">Manage your listed hotel properties, review guest reservations, and configure nightly pricing.</p>
          </div>
          <div>
            <button class="btn btn-primary" onclick="HotelEase.ui.openModal('modal-add-hotel')">
              <i class="fa-solid fa-circle-plus"></i> Register New Hotel
            </button>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--success); background: rgba(16, 185, 129, 0.1);"><i class="fa-solid fa-coins"></i></div>
            <div class="stat-info">
              <span class="stat-value" id="owner-total-rev">${ui.formatCurrency(stats.totalRevenue)}</span>
              <span class="stat-label">Total Revenue</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--primary); background: rgba(197, 168, 128, 0.1);"><i class="fa-solid fa-hotel"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.hotelsCount}</span>
              <span class="stat-label">Properties Listed</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--info); background: rgba(14, 165, 233, 0.1);"><i class="fa-solid fa-door-open"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.activeBookings}</span>
              <span class="stat-label">Active Bookings</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--warning); background: rgba(245, 158, 11, 0.1);"><i class="fa-solid fa-chart-pie"></i></div>
            <div class="stat-info">
              <span class="stat-value">${stats.occupancyRate}%</span>
              <span class="stat-label">Occupancy Rate</span>
            </div>
          </div>
        </div>

        <!-- Section Navigation Tabs -->
        <div class="tabs-nav">
          <button class="tab-btn ${activeTab === 'hotels' ? 'active' : ''}" id="owner-tab-hotels" onclick="HotelEase.owner.switchTab('hotels')">My Properties</button>
          <button class="tab-btn ${activeTab === 'bookings' ? 'active' : ''}" id="owner-tab-bookings" onclick="HotelEase.owner.switchTab('bookings')">Guest Reservations</button>
        </div>

        <!-- Dynamic Listings Content -->
        <div id="owner-tab-content">
          <!-- Populated by helper -->
        </div>
      </section>
    `;

    renderTabContent(stats);
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
  function renderTabContent(stats) {
    const content = document.getElementById('owner-tab-content');
    if (!content) return;

    const user = db.getCurrentUser();

    if (activeTab === 'hotels') {
      const hotels = db.getHotels({ ownerId: user.id });

      if (hotels.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-hotel"></i>
            <h4>No Properties Listed Yet</h4>
            <p>Ready to start earning? Click the button above to register your first hotel listing on the HotelEase network.</p>
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px;">
          ${hotels.map(hotel => {
            const approvalBadge = hotel.approved
              ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Approved & Active</span>'
              : '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Pending Admin Approval</span>';

            const roomTypesCount = hotel.rooms.length;

            return `
              <div class="booking-item-card fade-in">
                <div class="booking-item-img" style="background-image: url('${hotel.imageUrl}');"></div>
                <div class="booking-item-body">
                  <div class="booking-item-info">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                      ${approvalBadge}
                      ${ui.renderStars(hotel.rating)}
                    </div>
                    <h4>${hotel.name}</h4>
                    <p class="text-muted" style="font-size: 0.85rem;"><i class="fa-solid fa-location-dot"></i> ${hotel.location}</p>
                    <p class="text-muted" style="font-size: 0.88rem; margin-top: 8px;">${hotel.description}</p>
                    <div class="booking-item-meta" style="margin-top: 14px;">
                      <span><strong>Room Configurations:</strong> ${roomTypesCount} Type${roomTypesCount === 1 ? '' : 's'}</span>
                      <span><strong>Nightly Price Range:</strong> ${ui.formatCurrency(hotel.minPrice)} - ${ui.formatCurrency(hotel.maxPrice)}</span>
                    </div>
                  </div>
                  <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                      Base Price: <strong class="text-primary" style="font-size: 1.25rem;">${ui.formatCurrency(hotel.minPrice || 150)}</strong>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 16px;">
                      <button class="btn btn-outline btn-sm" onclick="HotelEase.owner.openRoomsConfigModal('${hotel.id}')">
                        <i class="fa-solid fa-bed"></i> Configure Rooms
                      </button>
                      <a href="#customer/hotel/${hotel.id}" class="btn btn-primary btn-sm ${hotel.approved ? '' : 'btn-outline'}" ${hotel.approved ? '' : 'style="pointer-events: none; opacity: 0.5;"'}>
                        <i class="fa-solid fa-eye"></i> View Listing
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      // Bookings tab
      const bookings = db.getBookings({ ownerId: user.id });

      if (bookings.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-calendar-days"></i>
            <h4>No Guest Bookings Found</h4>
            <p>Reservations will populate here once customers submit bookings for your properties.</p>
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <div class="table-responsive fade-in">
          <table class="data-table">
            <thead>
              <tr>
                <th>Reservation ID</th>
                <th>Hotel & Room</th>
                <th>Guest Details</th>
                <th>Stay Dates</th>
                <th>Total Earned</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.map(booking => {
                let badgeClass = 'badge-primary';
                if (booking.status === 'CheckedIn') badgeClass = 'badge-info';
                if (booking.status === 'CheckedOut') badgeClass = 'badge-success';
                if (booking.status === 'Cancelled') badgeClass = 'badge-danger';

                const nights = ui.getDaysDifference(booking.checkIn, booking.checkOut);

                // Determine actions
                let actionHtml = '-';
                if (booking.status === 'Confirmed') {
                  actionHtml = `
                    <button class="btn btn-primary btn-sm" onclick="HotelEase.owner.changeReservationStatus('${booking.id}', 'CheckedIn')">
                      Check In
                    </button>
                  `;
                } else if (booking.status === 'CheckedIn') {
                  actionHtml = `
                    <button class="btn btn-outline btn-sm" onclick="HotelEase.owner.changeReservationStatus('${booking.id}', 'CheckedOut')">
                      Check Out
                    </button>
                  `;
                }

                return `
                  <tr>
                    <td><strong>${booking.id}</strong></td>
                    <td>
                      <div><strong>${booking.hotelName}</strong></div>
                      <div class="text-muted" style="font-size: 0.8rem;">${booking.roomType}</div>
                    </td>
                    <td>
                      <div>${booking.customerName}</div>
                      <div class="text-muted" style="font-size: 0.8rem;">${booking.guests} Guests</div>
                    </td>
                    <td>
                      <div>${ui.formatDate(booking.checkIn)}</div>
                      <div class="text-muted" style="font-size: 0.8rem;">to ${ui.formatDate(booking.checkOut)} (${nights} N)</div>
                    </td>
                    <td><strong class="text-success">${ui.formatCurrency(booking.totalCost)}</strong></td>
                    <td><span class="badge ${badgeClass}">${booking.status}</span></td>
                    <td>${actionHtml}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // Handle hotel registration form submission
  function setupHotelRegistrationForm() {
    const form = document.getElementById('form-add-hotel');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const user = db.getCurrentUser();
      const name = document.getElementById('hotel-name').value.trim();
      const locationVal = document.getElementById('hotel-location').value.trim();
      const basePrice = Number(document.getElementById('hotel-base-price').value);
      const description = document.getElementById('hotel-description').value.trim();
      const imageUrl = document.getElementById('hotel-image').value.trim();

      // Check fields
      let isValid = true;
      if (!name) {
        document.getElementById('err-hotel-name').textContent = 'Hotel name is required';
        isValid = false;
      } else {
        document.getElementById('err-hotel-name').textContent = '';
      }

      if (!locationVal) {
        document.getElementById('err-hotel-location').textContent = 'City & Location are required';
        isValid = false;
      } else {
        document.getElementById('err-hotel-location').textContent = '';
      }

      if (!basePrice || basePrice < 20) {
        document.getElementById('err-hotel-base-price').textContent = 'Enter a valid base price (min $20)';
        isValid = false;
      } else {
        document.getElementById('err-hotel-base-price').textContent = '';
      }

      if (!description) {
        document.getElementById('err-hotel-description').textContent = 'Please enter a property description';
        isValid = false;
      } else {
        document.getElementById('err-hotel-description').textContent = '';
      }

      if (!isValid) return;

      // Extract checked amenities
      const amenities = [];
      document.querySelectorAll('input[name="hotel-amenity"]:checked').forEach(ch => {
        amenities.push(ch.value);
      });

      // Submit to DB
      const result = db.addHotel({
        name,
        location: locationVal,
        basePrice,
        description,
        imageUrl,
        amenities,
        ownerId: user.id
      });

      if (result) {
        ui.showToast('Listing submitted successfully! Awaiting Administrator review.', 'success');
        ui.closeModal('modal-add-hotel');
        form.reset();
        
        // Refresh dashboard views
        const container = document.getElementById('app-view');
        renderDashboardView(container);
      } else {
        ui.showToast('Failed to add hotel. Verify details.', 'error');
      }
    });
  }

  // Update check in/out booking state
  function changeReservationStatus(bookingId, newStatus) {
    const success = db.updateBookingStatus(bookingId, newStatus);
    if (success) {
      ui.showToast(`Reservation ${bookingId} updated to ${newStatus}.`, 'success');
      
      // Refresh current views
      const container = document.getElementById('app-view');
      renderDashboardView(container);
    } else {
      ui.showToast('Failed to update reservation status.', 'error');
    }
  }

  // ----------------------------------------------------
  // ROOM CONFIGURATION MODAL
  // ----------------------------------------------------
  function openRoomsConfigModal(hotelId) {
    currentConfiguringHotelId = hotelId;
    
    const hotel = db.getHotelById(hotelId);
    if (!hotel) return;

    // Check if configuration modal element exists, if not build it
    let configModal = document.getElementById('modal-room-config');
    if (configModal) configModal.remove();

    configModal = document.createElement('div');
    configModal.className = 'modal-overlay';
    configModal.id = 'modal-room-config';

    const rooms = hotel.rooms;

    configModal.innerHTML = `
      <div class="modal-card modal-lg">
        <button class="modal-close" onclick="HotelEase.ui.closeModal('modal-room-config')">&times;</button>
        <h3 class="modal-title">Configure Rooms</h3>
        <p class="modal-subtitle">Define room configurations, pricing structures, and occupancies for <strong>${hotel.name}</strong>.</p>
        
        <form id="form-room-config">
          <div id="room-config-items-container" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
            <!-- Rooms rows inject here -->
          </div>
          
          <div style="display:flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="HotelEase.owner.addNewRoomConfigRow()"><i class="fa-solid fa-plus"></i> Add Room Class</button>
            <div style="display:flex; gap: 10px;">
              <button type="button" class="btn btn-outline" onclick="HotelEase.ui.closeModal('modal-room-config')">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Configuration</button>
            </div>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(configModal);
    
    // Add backdrop dismiss click handler
    configModal.addEventListener('click', (e) => {
      if (e.target.id === 'modal-room-config') {
        ui.closeModal('modal-room-config');
      }
    });

    // Populate existing configs
    const rowsContainer = document.getElementById('room-config-items-container');
    if (rooms.length === 0) {
      // Add one empty default row
      addNewRoomConfigRow();
    } else {
      rooms.forEach(r => {
        addNewRoomConfigRow(r);
      });
    }

    ui.openModal('modal-room-config');

    // Handle Config Form Submission
    const form = document.getElementById('form-room-config');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const configRows = document.querySelectorAll('.room-config-row');
      const compiledRooms = [];

      let isValid = true;
      configRows.forEach(row => {
        const type = row.querySelector('.room-row-type').value.trim();
        const price = Number(row.querySelector('.room-row-price').value);
        const occupancy = Number(row.querySelector('.room-row-occupancy').value);
        const totalRooms = Number(row.querySelector('.room-row-count').value);

        if (!type || price <= 0 || occupancy <= 0 || totalRooms <= 0) {
          isValid = false;
          return;
        }

        compiledRooms.push({
          type,
          price,
          occupancy,
          totalRooms,
          amenities: ['King Bed', 'AC', 'Tv', 'Smart lock'] // Hardcode basic facilities for simplicity
        });
      });

      if (!isValid) {
        ui.showToast('Please verify all room fields contain positive non-empty numbers.', 'warning');
        return;
      }

      const result = db.updateHotelRooms(currentConfiguringHotelId, compiledRooms);
      if (result) {
        ui.showToast('Rooms configured successfully.', 'success');
        ui.closeModal('modal-room-config');
        
        // Refresh dashboard views
        const container = document.getElementById('app-view');
        renderDashboardView(container);
      } else {
        ui.showToast('Failed to save room details.', 'error');
      }
    });
  }

  // Add room config row inside rooms modal
  function addNewRoomConfigRow(room = null) {
    const container = document.getElementById('room-config-items-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'room-config-row form-group-row fade-in';
    row.style.gridTemplateColumns = '2fr 1fr 1fr 1fr auto';
    row.style.alignItems = 'flex-end';
    row.style.gap = '10px';
    row.style.background = 'rgba(255,255,255,0.02)';
    row.style.padding = '12px';
    row.style.borderRadius = 'var(--radius-sm)';

    row.innerHTML = `
      <div class="form-group" style="margin-bottom:0;">
        <label>Room Category Title</label>
        <input type="text" class="form-control room-row-type" placeholder="e.g. Presidential Suite" value="${room ? room.type : ''}" required>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>Nightly Price ($)</label>
        <input type="number" class="form-control room-row-price" min="20" placeholder="250" value="${room ? room.price : ''}" required>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>Guests</label>
        <input type="number" class="form-control room-row-occupancy" min="1" max="10" placeholder="2" value="${room ? room.occupancy : '2'}" required>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label>Quantity</label>
        <input type="number" class="form-control room-row-count" min="1" max="100" placeholder="5" value="${room ? room.totalRooms : '5'}" required>
      </div>
      <button type="button" class="btn btn-outline btn-sm btn-danger-hover" onclick="this.parentElement.remove()" style="padding: 12px; margin-bottom: 0; color: var(--danger); border-color: rgba(244,63,94,0.2);">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    container.appendChild(row);
  }

  // Export
  window.HotelEase.owner = {
    renderDashboardView,
    switchTab,
    setupHotelRegistrationForm,
    changeReservationStatus,
    openRoomsConfigModal,
    addNewRoomConfigRow
  };
})();

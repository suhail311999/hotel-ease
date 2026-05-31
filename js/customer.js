// customer.js - Customer Module
(function () {
  'use strict';

  window.HotelEase = window.HotelEase || {};
  window.HotelEase.customer = window.HotelEase.customer || {};

  const db = window.HotelEase.db;
  const ui = window.HotelEase.ui;

  // Active state for details page booking selections
  let selectedHotel = null;
  let selectedRoom = null;
  let bookingCheckIn = '';
  let bookingCheckOut = '';

  // ----------------------------------------------------
  // VIEW RENDERERS
  // ----------------------------------------------------

  // Render Explore / Hotel Search View
  function renderExploreView(container, queryParams = {}) {
    const defaultSearch = queryParams.city || '';
    
    // Seed dates if not present (today and 3 days from now)
    const today = new Date().toISOString().split('T')[0];
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    container.innerHTML = `
      <section class="hero-section">
        <div class="container">
          <p class="hero-subtitle">The Art of Luxury Travel</p>
          <h1 class="hero-title font-serif">Find Your Ease.</h1>
          <p class="hero-desc">Discover handpicked, premium hotels and boutique retreats globally, optimized for ultimate comfort and elegance.</p>
        </div>
      </section>

      <section class="container">
        <!-- Search & Filter Controls -->
        <div class="search-filter-box">
          <form id="search-hotels-form">
            <div class="search-form-row">
              <div class="form-group">
                <label for="search-location"><i class="fa-solid fa-location-dot"></i> Where are you going?</label>
                <input type="text" id="search-location" class="form-control" placeholder="e.g. New York, Miami, Kyoto" value="${defaultSearch}">
              </div>
              <div class="form-group">
                <label for="search-checkin"><i class="fa-solid fa-calendar-days"></i> Check-in</label>
                <input type="date" id="search-checkin" class="form-control" min="${today}" value="${today}">
              </div>
              <div class="form-group">
                <label for="search-checkout"><i class="fa-solid fa-calendar-days"></i> Check-out</label>
                <input type="date" id="search-checkout" class="form-control" min="${today}" value="${threeDays}">
              </div>
              <div class="form-group" style="display: flex; align-items: flex-end;">
                <button type="submit" class="btn btn-primary btn-block btn-lg"><i class="fa-solid fa-magnifying-glass"></i> Search</button>
              </div>
            </div>

            <!-- Expandable Filters -->
            <div class="filter-expansion-row">
              <!-- Price Slider -->
              <div class="filter-price-slider">
                <label for="filter-price">Max Nightly Price: <strong id="price-slider-val">$500</strong></label>
                <input type="range" id="filter-price" min="100" max="1000" step="50" value="700">
              </div>

              <!-- Min Rating Selector -->
              <div class="filter-rating">
                <select id="filter-min-rating" class="form-control" style="padding: 8px 12px; width: auto;">
                  <option value="0">All Ratings</option>
                  <option value="4">4.0+ Stars ★</option>
                  <option value="4.5">4.5+ Stars ★</option>
                  <option value="4.8">4.8+ Stars ★</option>
                </select>
              </div>

              <!-- Quick amenities checks -->
              <div class="filter-amenities-label" style="font-size: 0.85rem; color: var(--text-muted);">
                Amenities:
              </div>
              <label class="checkbox-label"><input type="checkbox" class="amenity-filter-check" value="Wifi"> Wifi</label>
              <label class="checkbox-label"><input type="checkbox" class="amenity-filter-check" value="Pool"> Pool</label>
              <label class="checkbox-label"><input type="checkbox" class="amenity-filter-check" value="Spa"> Spa</label>
              <label class="checkbox-label"><input type="checkbox" class="amenity-filter-check" value="Beach Access"> Beach</label>
            </div>
          </form>
        </div>

        <!-- Hotel Grid Output -->
        <div class="hotel-grid-header">
          <h2 id="search-results-heading">Featured Stays</h2>
          <span class="text-muted" id="search-results-count">5 Hotels found</span>
        </div>

        <div class="hotel-grid" id="explore-hotel-grid">
          <!-- Populated by JavaScript -->
        </div>
      </section>
    `;

    // Setup dates input bounds logic
    const checkinIn = container.querySelector('#search-checkin');
    const checkoutIn = container.querySelector('#search-checkout');

    checkinIn.addEventListener('change', () => {
      checkoutIn.min = checkinIn.value;
      if (new Date(checkoutIn.value) <= new Date(checkinIn.value)) {
        // Set to checkin + 1 day
        const nextDay = new Date(new Date(checkinIn.value).getTime() + 24 * 60 * 60 * 1000);
        checkoutIn.value = nextDay.toISOString().split('T')[0];
      }
    });

    // Slider display listener
    const slider = container.querySelector('#filter-price');
    const sliderVal = container.querySelector('#price-slider-val');
    slider.addEventListener('input', () => {
      sliderVal.textContent = ui.formatCurrency(slider.value);
    });
    sliderVal.textContent = ui.formatCurrency(slider.value);

    // Form submission search
    const form = container.querySelector('#search-hotels-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executeHotelSearch(container);
    });

    // Sub-filters listeners (immediate trigger)
    slider.addEventListener('change', () => executeHotelSearch(container));
    container.querySelector('#filter-min-rating').addEventListener('change', () => executeHotelSearch(container));
    container.querySelectorAll('.amenity-filter-check').forEach(ch => {
      ch.addEventListener('change', () => executeHotelSearch(container));
    });

    // Initial load
    executeHotelSearch(container);
  }

  // Execute Search query and render card items
  function executeHotelSearch(container) {
    const grid = container.querySelector('#explore-hotel-grid');
    const resultsHeading = container.querySelector('#search-results-heading');
    const resultsCount = container.querySelector('#search-results-count');

    const locationQuery = container.querySelector('#search-location').value;
    const maxPrice = Number(container.querySelector('#filter-price').value);
    const minRating = Number(container.querySelector('#filter-min-rating').value);

    const checkedAmenities = [];
    container.querySelectorAll('.amenity-filter-check:checked').forEach(ch => {
      checkedAmenities.push(ch.value);
    });

    // Query DB
    const filters = {
      onlyApproved: true,
      searchQuery: locationQuery,
      maxPrice: maxPrice,
      minRating: minRating,
      amenities: checkedAmenities
    };

    const hotels = db.getHotels(filters);

    // Update Headers
    if (locationQuery) {
      resultsHeading.textContent = `Stays in "${locationQuery}"`;
    } else {
      resultsHeading.textContent = 'Featured Stays';
    }
    resultsCount.textContent = `${hotels.length} hotel${hotels.length === 1 ? '' : 's'} matching`;

    // Render Grid
    if (hotels.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fa-solid fa-circle-exclamation"></i>
          <h4>No Stays Found</h4>
          <p>We couldn't find any approved hotels matching your specific filters. Try expanding your price limit or clearing amenities.</p>
          <button class="btn btn-outline" onclick="location.hash='#customer/explore'">Reset Search</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = hotels.map(hotel => {
      const amenitiesHtml = hotel.amenities.slice(0, 3).map(a => `<span class="badge badge-primary" style="margin-right: 4px; margin-bottom: 4px;">${a}</span>`).join('');
      const moreCount = hotel.amenities.length - 3;
      const extraAmenitiesHtml = moreCount > 0 ? `<span class="badge badge-info" style="font-size: 0.7rem;">+${moreCount} more</span>` : '';

      return `
        <article class="hotel-card fade-in">
          <div class="hotel-card-img-wrapper">
            <img class="hotel-card-img" src="${hotel.imageUrl}" alt="${hotel.name}">
            <div class="hotel-card-tag">${hotel.location}</div>
          </div>
          <div class="hotel-card-content">
            <h3 class="hotel-card-title">${hotel.name}</h3>
            <div class="hotel-card-loc">${ui.renderStars(hotel.rating)}</div>
            <p class="hotel-card-desc">${hotel.description}</p>
            <div style="margin-bottom: 16px; display: flex; flex-wrap: wrap;">
              ${amenitiesHtml}
              ${extraAmenitiesHtml}
            </div>
            <div class="hotel-card-footer">
              <div class="hotel-card-price">
                <span class="unit">nightly rates from</span>
                <div class="amount">${ui.formatCurrency(hotel.minPrice || 150)}<span class="unit" style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted)">/night</span></div>
              </div>
              <a href="#customer/hotel/${hotel.id}" class="btn btn-outline btn-sm">Details <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Render Hotel Details View (with specific room list & review grid)
  function renderDetailsView(container, hotelId) {
    const hotel = db.getHotelById(hotelId);

    if (!hotel) {
      container.innerHTML = `
        <div class="container" style="padding: 80px 0;">
          <div class="empty-state">
            <i class="fa-solid fa-magnifying-glass"></i>
            <h4>Hotel Not Found</h4>
            <p>The hotel you requested does not exist or has been removed from our listings.</p>
            <a href="#customer/explore" class="btn btn-primary">Return to Explore</a>
          </div>
        </div>
      `;
      return;
    }

    selectedHotel = hotel;

    // Seed dates (today and tomorrow)
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Save dates to checkouts variables
    bookingCheckIn = todayStr;
    bookingCheckOut = tomorrowStr;

    const amenitiesHtml = hotel.amenities.map(a => `
      <span class="amenity-tag">
        <i class="fa-solid fa-circle-check text-success"></i> ${a}
      </span>
    `).join('');

    container.innerHTML = `
      <section class="details-hero">
        <img src="${hotel.imageUrl}" alt="${hotel.name}" class="details-hero-img">
        <div class="details-hero-overlay"></div>
        <div class="details-header-content">
          <div class="container">
            <a href="#customer/explore" class="btn btn-outline btn-sm" style="background: rgba(0,0,0,0.5); border-color: transparent; margin-bottom: 20px; color: var(--text-main);"><i class="fa-solid fa-chevron-left"></i> Back to Explore</a>
            <h1 class="font-serif" style="font-size: 3rem; text-shadow: 0 4px 10px rgba(0,0,0,0.8);">${hotel.name}</h1>
            <div style="display: flex; align-items: center; gap: 16px; margin-top: 8px;">
              <span class="badge badge-primary"><i class="fa-solid fa-location-dot"></i> ${hotel.location}</span>
              ${ui.renderStars(hotel.rating)}
            </div>
          </div>
        </div>
      </section>

      <section class="container">
        <div class="details-container-grid">
          
          <!-- Left Main Column (Details, Rooms, Reviews) -->
          <div class="details-info-panel">
            <h3>About the Property</h3>
            <p style="font-size: 1.05rem; color: var(--text-muted); margin-bottom: 24px; text-align: justify;">${hotel.description}</p>
            
            <h3>Amenities Offered</h3>
            <div class="amenities-list">
              ${amenitiesHtml}
            </div>

            <h3>Available Rooms & Accommodations</h3>
            <div class="room-selection-list" id="room-list-container">
              <!-- Populated dynamically -->
            </div>

            <!-- Reviews Section -->
            <div class="reviews-section">
              <h3>Guest Reviews</h3>
              <div class="reviews-summary">
                <span class="big-rating">${hotel.rating.toFixed(1)}</span>
                <div>
                  <strong>Average Rating</strong>
                  <p class="text-muted" style="font-size: 0.85rem;">Based on ${hotel.reviews.length} customer reviews</p>
                </div>
              </div>

              <div class="review-list">
                ${hotel.reviews.length === 0 ? `
                  <p class="text-muted" style="font-style: italic;">No reviews yet for this hotel. Be the first to book and share your feedback!</p>
                ` : hotel.reviews.map(r => `
                  <div class="review-card">
                    <div class="review-card-header">
                      <div>
                        <span class="review-card-author">${r.customerName}</span>
                        ${ui.renderStars(r.rating)}
                      </div>
                      <span class="review-card-date">${ui.formatDate(r.date)}</span>
                    </div>
                    <p class="review-card-comment">"${r.comment}"</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Sidebar Column (Sticky Booking Settings) -->
          <div>
            <div class="booking-side-card">
              <h4>Choose Stay Dates</h4>
              
              <div class="form-group">
                <label for="book-date-in"><i class="fa-solid fa-calendar-import"></i> Check-In Date</label>
                <input type="date" id="book-date-in" class="form-control" min="${todayStr}" value="${todayStr}">
              </div>
              
              <div class="form-group">
                <label for="book-date-out"><i class="fa-solid fa-calendar-export"></i> Check-Out Date</label>
                <input type="date" id="book-date-out" class="form-control" min="${tomorrowStr}" value="${tomorrowStr}">
              </div>

              <div class="stay-duration-indicator" style="background: rgba(197, 168, 128, 0.05); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-color); text-align: center; font-size: 0.9rem;">
                Stay Duration: <strong id="stay-nights-count">1 Night</strong>
              </div>

              <p class="text-muted" style="font-size: 0.8rem; margin-top: 12px; text-align: center;">
                Select stay dates above, then select a room type on the left to initiate checkout.
              </p>
            </div>
          </div>

        </div>
      </section>
    `;

    // Listeners for date inputs
    const dateIn = container.querySelector('#book-date-in');
    const dateOut = container.querySelector('#book-date-out');
    const nightsCount = container.querySelector('#stay-nights-count');

    function updateNights() {
      bookingCheckIn = dateIn.value;
      bookingCheckOut = dateOut.value;
      const nights = ui.getDaysDifference(bookingCheckIn, bookingCheckOut);
      nightsCount.textContent = `${nights} Night${nights === 1 ? '' : 's'}`;
      
      // Re-render rooms list to update final pricing simulation
      renderRoomsSelection(hotel);
    }

    dateIn.addEventListener('change', () => {
      dateOut.min = dateIn.value;
      if (new Date(dateOut.value) <= new Date(dateIn.value)) {
        const nextDay = new Date(new Date(dateIn.value).getTime() + 24 * 60 * 60 * 1000);
        dateOut.value = nextDay.toISOString().split('T')[0];
      }
      updateNights();
    });

    dateOut.addEventListener('change', updateNights);

    // Initial render of rooms list
    renderRoomsSelection(hotel);
  }

  // Render rooms list depending on nights selected
  function renderRoomsSelection(hotel) {
    const listContainer = document.getElementById('room-list-container');
    if (!listContainer) return;

    const nights = ui.getDaysDifference(bookingCheckIn, bookingCheckOut) || 1;

    if (hotel.rooms.length === 0) {
      listContainer.innerHTML = `
        <p class="text-muted" style="font-style: italic;">No room configurations are active for this hotel right now.</p>
      `;
      return;
    }

    listContainer.innerHTML = hotel.rooms.map(room => {
      const isAvailable = room.availableRooms > 0;
      const totalCost = room.price * nights;
      
      const amenitiesBadges = room.amenities.map(a => `<span class="room-amenity-badge">${a}</span>`).join('');

      return `
        <div class="room-card fade-in">
          <div class="room-details">
            <h4 class="text-primary">${room.type}</h4>
            <div class="room-specs">
              <span><i class="fa-solid fa-user-group"></i> Max Guests: ${room.occupancy}</span>
              <span><i class="fa-solid fa-bed"></i> Comfort Features</span>
              <span class="${isAvailable ? 'text-success' : 'text-danger'}">
                <i class="fa-solid ${isAvailable ? 'fa-check' : 'fa-circle-xmark'}"></i> 
                ${isAvailable ? `${room.availableRooms} rooms vacant` : 'Sold Out'}
              </span>
            </div>
            <div class="room-amenities">
              ${amenitiesBadges}
            </div>
          </div>
          <div class="room-pricing-action">
            <div class="room-price-val">
              ${ui.formatCurrency(room.price)}<span>/night</span>
            </div>
            <span class="text-muted" style="font-size: 0.8rem;">Est. Total: ${ui.formatCurrency(totalCost)} (${nights} night${nights === 1 ? '' : 's'})</span>
            <button class="btn btn-primary btn-sm ${isAvailable ? '' : 'btn-outline'}" 
                    ${isAvailable ? '' : 'disabled'}
                    onclick="HotelEase.customer.initiateCheckout('${room.id}')">
              ${isAvailable ? 'Book Room' : 'Unavailable'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Customer dashboard
  function renderDashboardView(container) {
    const user = db.getCurrentUser();
    if (!user || user.role !== 'customer') {
      container.innerHTML = `
        <div class="container" style="padding: 80px 0;">
          <div class="empty-state">
            <i class="fa-solid fa-lock"></i>
            <h4>Access Denied</h4>
            <p>You must be logged in as a Customer to view this dashboard.</p>
            <button class="btn btn-primary" onclick="HotelEase.ui.openModal('modal-auth')">Log In Now</button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <section class="dashboard-layout container">
        <div class="dashboard-header">
          <div>
            <h1 class="font-serif">Guest Dashboard</h1>
            <p class="text-muted">Welcome back, ${user.name}! Track your reservations, cancel stays, and submit reviews.</p>
          </div>
          <div style="background: var(--bg-card); padding: 12px 24px; border: 1px solid var(--border-color); border-radius: var(--radius-lg); display: flex; align-items: center; gap: 16px;">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);"><i class="fa-solid fa-wallet"></i></div>
            <div>
              <span class="text-muted" style="font-size: 0.8rem; display:block;">Your Wallet Balance</span>
              <strong style="font-size: 1.4rem; color: var(--success);">${ui.formatCurrency(user.balance)}</strong>
            </div>
          </div>
        </div>

        <!-- Dashboard Stats Row -->
        <div class="stats-grid" id="customer-stats-grid">
          <!-- Rendered dynamically -->
        </div>

        <!-- Bookings Tabs -->
        <div class="tabs-nav">
          <button class="tab-btn active" id="tab-btn-active" onclick="HotelEase.customer.toggleDashboardTabs('active')">Active Bookings</button>
          <button class="tab-btn" id="tab-btn-history" onclick="HotelEase.customer.toggleDashboardTabs('history')">Stay History</button>
        </div>

        <!-- Bookings list container -->
        <div id="customer-bookings-list" class="booking-list">
          <!-- Rendered dynamically -->
        </div>
      </section>
    `;

    renderDashboardStats();
    renderCustomerBookingsList('active');
  }

  // Render stats inside Dashboard
  function renderDashboardStats() {
    const user = db.getCurrentUser();
    const bookings = db.getBookings({ customerId: user.id });
    
    const active = bookings.filter(b => b.status === 'Confirmed' || b.status === 'CheckedIn').length;
    const completed = bookings.filter(b => b.status === 'CheckedOut').length;
    const cancelled = bookings.filter(b => b.status === 'Cancelled').length;
    const totalSpent = bookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalCost, 0);

    const statsGrid = document.getElementById('customer-stats-grid');
    if (!statsGrid) return;

    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon"><i class="fa-solid fa-umbrella-beach"></i></div>
        <div class="stat-info">
          <span class="stat-value">${active}</span>
          <span class="stat-label">Active Bookings</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="color: var(--success); background: rgba(16, 185, 129, 0.1);"><i class="fa-solid fa-circle-check"></i></div>
        <div class="stat-info">
          <span class="stat-value">${completed}</span>
          <span class="stat-label">Completed Stays</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="color: var(--danger); background: rgba(244, 63, 94, 0.1);"><i class="fa-solid fa-ban"></i></div>
        <div class="stat-info">
          <span class="stat-value">${cancelled}</span>
          <span class="stat-label">Cancelled Bookings</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="color: var(--info); background: rgba(14, 165, 233, 0.1);"><i class="fa-solid fa-coins"></i></div>
        <div class="stat-info">
          <span class="stat-value">${ui.formatCurrency(totalSpent)}</span>
          <span class="stat-label">Total Expended</span>
        </div>
      </div>
    `;
  }

  // Render list of active/history bookings
  function renderCustomerBookingsList(tabType) {
    const listContainer = document.getElementById('customer-bookings-list');
    if (!listContainer) return;

    const user = db.getCurrentUser();
    const bookings = db.getBookings({ customerId: user.id });

    let filtered = [];
    if (tabType === 'active') {
      filtered = bookings.filter(b => b.status === 'Confirmed' || b.status === 'CheckedIn');
    } else {
      filtered = bookings.filter(b => b.status === 'CheckedOut' || b.status === 'Cancelled');
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-calendar-xmark"></i>
          <h4>No Bookings in this Category</h4>
          <p>${tabType === 'active' ? 'You do not have any upcoming reservations.' : 'No booking archives were found.'}</p>
          ${tabType === 'active' ? '<a href="#customer/explore" class="btn btn-primary">Find a Hotel</a>' : ''}
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(booking => {
      let badgeClass = 'badge-primary';
      if (booking.status === 'CheckedIn') badgeClass = 'badge-info';
      if (booking.status === 'CheckedOut') badgeClass = 'badge-success';
      if (booking.status === 'Cancelled') badgeClass = 'badge-danger';

      const nights = ui.getDaysDifference(booking.checkIn, booking.checkOut);

      // Buttons
      let actionButtons = '';
      if (booking.status === 'Confirmed') {
        actionButtons = `
          <button class="btn btn-outline btn-sm btn-danger-hover" onclick="HotelEase.customer.cancelBookingClick('${booking.id}')">
            <i class="fa-solid fa-ban"></i> Cancel Booking
          </button>
        `;
      } else if (booking.status === 'CheckedOut') {
        actionButtons = `
          <button class="btn btn-primary btn-sm" onclick="HotelEase.customer.openReviewModal('${booking.hotelId}', '${booking.id}')">
            <i class="fa-solid fa-pen-to-square"></i> Leave Review
          </button>
        `;
      }

      return `
        <div class="booking-item-card fade-in">
          <div class="booking-item-img" style="background-image: url('${booking.hotelImageUrl}');"></div>
          <div class="booking-item-body">
            <div class="booking-item-info">
              <span class="badge ${badgeClass}" style="margin-bottom: 8px;">${booking.status}</span>
              <h4>${booking.hotelName}</h4>
              <p class="text-muted" style="font-size: 0.85rem;"><i class="fa-solid fa-location-dot"></i> ${booking.hotelLocation}</p>
              <div class="booking-item-meta">
                <span><strong>Room:</strong> ${booking.roomType}</span>
                <span><strong>Guests:</strong> ${booking.guests} guest${booking.guests > 1 ? 's' : ''}</span>
                <span><strong>Dates:</strong> ${ui.formatDate(booking.checkIn)} - ${ui.formatDate(booking.checkOut)} (${nights} night${nights > 1 ? 's' : ''})</span>
              </div>
            </div>
            <div class="booking-item-actions">
              <div class="booking-item-price">
                <span class="cost">${ui.formatCurrency(booking.totalCost)}</span>
                <span class="text-muted" style="font-size: 0.75rem;">Paid via Wallet</span>
              </div>
              <div style="width: 100%; text-align: right; margin-top: 10px;">
                ${actionButtons}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ----------------------------------------------------
  // BOOKING & CHECKOUT ACTIONS
  // ----------------------------------------------------

  // Initiate Booking Checkout Modal
  function initiateCheckout(roomId) {
    const user = db.getCurrentUser();
    if (!user) {
      ui.showToast('Please log in or register a customer account to book rooms.', 'warning');
      ui.openModal('modal-auth');
      return;
    }

    if (user.role !== 'customer') {
      ui.showToast('Only Customer accounts can book accommodations.', 'error');
      return;
    }

    const room = selectedHotel.rooms.find(r => r.id === roomId);
    if (!room) return;

    selectedRoom = room;

    // Load elements
    const modal = document.getElementById('modal-booking');
    const summaryImg = document.getElementById('book-summary-img');
    const summaryName = document.getElementById('book-summary-name');
    const summaryLoc = document.getElementById('book-summary-location');
    const summaryRoom = document.getElementById('book-summary-room-type');
    const summaryCheckin = document.getElementById('book-summary-checkin');
    const summaryCheckout = document.getElementById('book-summary-checkout');

    const labelPrice = document.getElementById('price-calc-label');
    const subtotal = document.getElementById('price-calc-subtotal');
    const tax = document.getElementById('price-calc-tax');
    const grandTotal = document.getElementById('price-calc-total');

    const walletBalance = document.getElementById('checkout-wallet-balance');
    const balanceAlert = document.querySelector('.wallet-balance-alert');
    const balanceStatus = document.getElementById('checkout-balance-status');
    const payBtn = document.getElementById('btn-pay-now');

    const checkoutGuests = document.getElementById('checkout-guests');

    // Populate Details
    summaryImg.style.backgroundImage = `url('${selectedHotel.imageUrl}')`;
    summaryName.textContent = selectedHotel.name;
    summaryLoc.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${selectedHotel.location}`;
    summaryRoom.textContent = room.type;
    summaryCheckin.textContent = ui.formatDate(bookingCheckIn);
    summaryCheckout.textContent = ui.formatDate(bookingCheckOut);

    // Pricing math
    const nights = ui.getDaysDifference(bookingCheckIn, bookingCheckOut) || 1;
    const rawCost = room.price * nights;
    const taxCost = Math.round(rawCost * 0.12);
    const totalCost = rawCost + taxCost;

    labelPrice.textContent = `${ui.formatCurrency(room.price)} x ${nights} night${nights === 1 ? '' : 's'}`;
    subtotal.textContent = ui.formatCurrency(rawCost);
    tax.textContent = ui.formatCurrency(taxCost);
    grandTotal.textContent = ui.formatCurrency(totalCost);

    // Populate Guests selection options based on max room occupancy
    checkoutGuests.innerHTML = '';
    for (let i = 1; i <= room.occupancy; i++) {
      checkoutGuests.innerHTML += `<option value="${i}" ${i === 2 && room.occupancy >= 2 ? 'selected' : ''}>${i} Guest${i > 1 ? 's' : ''}</option>`;
    }

    // Wallet checks
    walletBalance.textContent = ui.formatCurrency(user.balance);
    if (user.balance >= totalCost) {
      balanceAlert.classList.remove('insufficient');
      balanceStatus.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i> Sufficient Balance';
      payBtn.disabled = false;
      payBtn.textContent = 'Confirm and Pay Now';
    } else {
      balanceAlert.classList.add('insufficient');
      balanceStatus.innerHTML = '<i class="fa-solid fa-circle-xmark text-danger"></i> Insufficient Funds';
      payBtn.disabled = true;
      payBtn.textContent = 'Insufficient Wallet Funds';
    }

    ui.openModal('modal-booking');

    // Attach Checkout form submission
    const form = document.getElementById('form-checkout');
    form.onsubmit = (e) => {
      e.preventDefault();
      
      const details = {
        hotelId: selectedHotel.id,
        roomId: selectedRoom.id,
        customerId: user.id,
        checkIn: bookingCheckIn,
        checkOut: bookingCheckOut,
        guests: checkoutGuests.value,
        totalCost: totalCost
      };

      const result = db.createBooking(details);
      if (result.success) {
        ui.showToast('Reservation confirmed successfully! Enjoy your stay.', 'success');
        ui.closeModal('modal-booking');
        
        // Refresh wallet balance display in navbar
        const walletDisplay = document.getElementById('display-wallet-balance');
        if (walletDisplay) {
          walletDisplay.textContent = ui.formatCurrency(db.getCurrentUser().balance);
        }

        // Navigate to dashboard after short delay
        setTimeout(() => {
          window.location.hash = '#customer/dashboard';
        }, 800);
      } else {
        ui.showToast(result.message, 'error');
      }
    };
  }

  // Cancel Booking
  function cancelBookingClick(bookingId) {
    if (confirm('Are you sure you want to cancel this booking? A full refund will be processed back to your wallet.')) {
      const result = db.cancelBooking(bookingId);
      if (result.success) {
        ui.showToast(`Booking cancelled. Refund of ${ui.formatCurrency(result.refundAmount)} was processed.`, 'success');
        
        // Refresh wallet display in navbar
        const walletDisplay = document.getElementById('display-wallet-balance');
        if (walletDisplay) {
          walletDisplay.textContent = ui.formatCurrency(db.getCurrentUser().balance);
        }

        // Re-render
        renderDashboardStats();
        renderCustomerBookingsList('active');
      } else {
        ui.showToast(result.message, 'error');
      }
    }
  }

  // Open review submit modal
  function openReviewModal(hotelId, bookingId) {
    // Dynamically insert rating modal card or form
    const prevModal = document.getElementById('modal-review');
    if (prevModal) prevModal.remove();

    const reviewModal = document.createElement('div');
    reviewModal.className = 'modal-overlay';
    reviewModal.id = 'modal-review';
    
    reviewModal.innerHTML = `
      <div class="modal-card modal-sm">
        <button class="modal-close" onclick="HotelEase.ui.closeModal('modal-review')">&times;</button>
        <h3 class="modal-title">Share Your Experience</h3>
        <p class="modal-subtitle">Your reviews help other travelers choose the perfect stay.</p>
        
        <form id="form-submit-review">
          <div class="form-group">
            <label for="review-rating">Rating (1 to 5 Stars)</label>
            <select id="review-rating" class="form-control">
              <option value="5" selected>5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Terrible</option>
            </select>
          </div>
          <div class="form-group">
            <label for="review-comment">Written Review</label>
            <textarea id="review-comment" class="form-control" rows="4" placeholder="Tell us about the room, amenities, location..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Submit Review</button>
        </form>
      </div>
    `;

    document.body.appendChild(reviewModal);
    
    // Add backdrop dismiss click handler
    reviewModal.addEventListener('click', (e) => {
      if (e.target.id === 'modal-review') {
        ui.closeModal('modal-review');
      }
    });

    ui.openModal('modal-review');

    const form = document.getElementById('form-submit-review');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const user = db.getCurrentUser();
      const rating = document.getElementById('review-rating').value;
      const comment = document.getElementById('review-comment').value;

      const reviewResult = db.addReview({
        hotelId,
        customerId: user.id,
        customerName: user.name,
        rating,
        comment
      });

      if (reviewResult) {
        ui.showToast('Thank you! Review submitted successfully.', 'success');
        ui.closeModal('modal-review');
        
        // Mark booking stay history to prevent duplicate reviews or just show success
        db.updateBookingStatus(bookingId, 'CheckedOut'); // already checked out
        
        // Re-render
        renderCustomerBookingsList('history');
        renderDashboardStats();
      } else {
        ui.showToast('Failed to post review. Please try again.', 'error');
      }
    });
  }

  // Dashboard navigation tabs toggle
  function toggleDashboardTabs(tabType) {
    const tabActive = document.getElementById('tab-btn-active');
    const tabHistory = document.getElementById('tab-btn-history');

    if (tabType === 'active') {
      tabActive.classList.add('active');
      tabHistory.classList.remove('active');
      renderCustomerBookingsList('active');
    } else {
      tabHistory.classList.add('active');
      tabActive.classList.remove('active');
      renderCustomerBookingsList('history');
    }
  }

  // Export
  window.HotelEase.customer = {
    renderExploreView,
    renderDetailsView,
    renderDashboardView,
    initiateCheckout,
    cancelBookingClick,
    openReviewModal,
    toggleDashboardTabs
  };
})();

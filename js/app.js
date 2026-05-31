// app.js - App Orchestrator & Router
(function () {
  'use strict';

  window.HotelEase = window.HotelEase || {};

  const db = window.HotelEase.db;
  const ui = window.HotelEase.ui;
  const customer = window.HotelEase.customer;
  const owner = window.HotelEase.owner;
  const admin = window.HotelEase.admin;

  // Global elements
  let appView = null;

  // ----------------------------------------------------
  // CLIENT-SIDE ROUTER
  // ----------------------------------------------------
  function router() {
    const hash = window.location.hash || '#customer/explore';
    const viewContainer = document.getElementById('app-view');
    if (!viewContainer) return;

    // Reset navigation active link status
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    // Route Matching
    if (hash === '#customer/explore' || hash.startsWith('#customer/explore?')) {
      // Parse query params if any
      const params = {};
      if (hash.includes('?')) {
        const queryStr = hash.split('?')[1];
        const searchParams = new URLSearchParams(queryStr);
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
      }
      
      document.getElementById('nav-link-explore').classList.add('active');
      customer.renderExploreView(viewContainer, params);
      
    } else if (hash.startsWith('#customer/hotel/')) {
      const parts = hash.split('/');
      const hotelId = parts[parts.length - 1];
      customer.renderDetailsView(viewContainer, hotelId);
      
    } else if (hash === '#customer/dashboard') {
      const user = db.getCurrentUser();
      if (!user || user.role !== 'customer') {
        window.location.hash = '#customer/explore';
        ui.showToast('Authentication required. Log in to view dashboard.', 'warning');
        return;
      }
      customer.renderDashboardView(viewContainer);
      
    } else if (hash === '#owner/dashboard') {
      const user = db.getCurrentUser();
      if (!user || user.role !== 'owner') {
        window.location.hash = '#customer/explore';
        ui.showToast('Authorized credentials required. Log in as hotel owner.', 'warning');
        return;
      }
      const ownerLink = document.getElementById('nav-link-owner');
      if (ownerLink) ownerLink.classList.add('active');
      owner.renderDashboardView(viewContainer);
      
    } else if (hash === '#admin/dashboard') {
      const user = db.getCurrentUser();
      if (!user || user.role !== 'admin') {
        window.location.hash = '#customer/explore';
        ui.showToast('Administrator privileges required.', 'warning');
        return;
      }
      const adminLink = document.getElementById('nav-link-admin');
      if (adminLink) adminLink.classList.add('active');
      admin.renderDashboardView(viewContainer);
      
    } else {
      // Fallback
      window.location.hash = '#customer/explore';
    }

    // Scroll back to top on page navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Collapse mobile menu if active
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) navMenu.classList.remove('active');
  }

  // ----------------------------------------------------
  // AUTHENTICATION INTERACTIVE SYSTEM
  // ----------------------------------------------------
  function updateAuthHeaderUI() {
    const user = db.getCurrentUser();

    const loggedOutBlock = document.getElementById('auth-logged-out');
    const loggedInBlock = document.getElementById('auth-logged-in');

    const displayName = document.getElementById('display-user-name');
    const displayRole = document.getElementById('display-user-role');
    const walletBlock = document.getElementById('wallet-indicator');
    const walletVal = document.getElementById('display-wallet-balance');
    const userAvatar = document.getElementById('user-avatar');

    // Role specific nav links wrappers
    const ownerItems = document.querySelectorAll('.owner-only');
    const adminItems = document.querySelectorAll('.admin-only');
    const customerItems = document.querySelectorAll('.customer-only');

    if (user) {
      loggedOutBlock.style.display = 'none';
      loggedInBlock.style.display = 'flex';

      displayName.textContent = user.name;
      displayRole.textContent = user.role;
      userAvatar.textContent = user.name.charAt(0);

      // Render wallet indicator for customers
      if (user.role === 'customer') {
        walletBlock.style.display = 'flex';
        walletVal.textContent = ui.formatCurrency(user.balance);
        customerItems.forEach(el => el.style.display = '');
      } else {
        walletBlock.style.display = 'none';
        customerItems.forEach(el => el.style.display = 'none');
      }

      // Toggle Role links visibility
      if (user.role === 'owner') {
        ownerItems.forEach(el => el.style.display = '');
        adminItems.forEach(el => el.style.display = 'none');
      } else if (user.role === 'admin') {
        ownerItems.forEach(el => el.style.display = 'none');
        adminItems.forEach(el => el.style.display = '');
      } else {
        ownerItems.forEach(el => el.style.display = 'none');
        adminItems.forEach(el => el.style.display = 'none');
      }

    } else {
      loggedOutBlock.style.display = 'flex';
      loggedInBlock.style.display = 'none';
      
      // Hide role based links
      ownerItems.forEach(el => el.style.display = 'none');
      adminItems.forEach(el => el.style.display = 'none');
      customerItems.forEach(el => el.style.display = 'none');
    }
  }

  // Bind Login / Register forms validations & clicks
  function setupAuthForms() {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');

    const authModal = document.getElementById('modal-auth');
    
    const showRegisterLink = document.getElementById('link-show-register');
    const showLoginLink = document.getElementById('link-show-login');

    const loginView = document.getElementById('auth-view-login');
    const registerView = document.getElementById('auth-view-register');

    // Toggle forms
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginView.style.display = 'none';
      registerView.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      registerView.style.display = 'none';
      loginView.style.display = 'block';
    });

    // Demo Logins tags listener
    document.querySelectorAll('.demo-login-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        const email = tag.dataset.email;
        const pass = tag.dataset.pass;
        
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = pass;
        
        // Auto submit
        loginForm.dispatchEvent(new Event('submit'));
      });
    });

    // Login Form Submit
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-password').value;

      let isValid = true;
      if (!email) {
        document.getElementById('err-login-email').textContent = 'Email is required';
        isValid = false;
      } else {
        document.getElementById('err-login-email').textContent = '';
      }

      if (!pass) {
        document.getElementById('err-login-password').textContent = 'Password is required';
        isValid = false;
      } else {
        document.getElementById('err-login-password').textContent = '';
      }

      if (!isValid) return;

      const btn = loginForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      ui.setLoading(btn, true);

      setTimeout(() => {
        const res = db.login(email, pass);
        ui.setLoading(btn, false, originalText);

        if (res.success) {
          ui.showToast(`Logged in successfully as ${res.user.name}!`, 'success');
          ui.closeModal('modal-auth');
          loginForm.reset();
          updateAuthHeaderUI();

          // Redirect to appropriate dashboard based on role
          if (res.user.role === 'owner') {
            window.location.hash = '#owner/dashboard';
          } else if (res.user.role === 'admin') {
            window.location.hash = '#admin/dashboard';
          } else {
            // If on explore page, keep it, otherwise refresh
            if (window.location.hash.startsWith('#customer/explore') || window.location.hash === '') {
              router();
            } else {
              window.location.hash = '#customer/explore';
            }
          }
        } else {
          ui.showToast(res.message, 'error');
        }
      }, 500);
    });

    // Register Form Submit
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const pass = document.getElementById('register-password').value;
      const role = document.getElementById('register-role').value;

      let isValid = true;
      if (!name) {
        document.getElementById('err-register-name').textContent = 'Full name is required';
        isValid = false;
      } else {
        document.getElementById('err-register-name').textContent = '';
      }

      if (!email) {
        document.getElementById('err-register-email').textContent = 'Email is required';
        isValid = false;
      } else {
        document.getElementById('err-register-email').textContent = '';
      }

      if (!pass || pass.length < 6) {
        document.getElementById('err-register-password').textContent = 'Password must be at least 6 characters';
        isValid = false;
      } else {
        document.getElementById('err-register-password').textContent = '';
      }

      if (!isValid) return;

      const btn = registerForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      ui.setLoading(btn, true);

      setTimeout(() => {
        const res = db.register(name, email, pass, role);
        ui.setLoading(btn, false, originalText);

        if (res.success) {
          ui.showToast(res.message, 'success');
          // Switch to login
          registerForm.reset();
          registerView.style.display = 'none';
          loginView.style.display = 'block';
        } else {
          ui.showToast(res.message, 'error');
        }
      }, 500);
    });
  }

  // ----------------------------------------------------
  // DEMO WALLET FUNDING ACTIONS
  // ----------------------------------------------------
  function setupWalletFunding() {
    const trigger = document.getElementById('btn-add-funds');
    const form = document.getElementById('form-add-funds');

    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        ui.openModal('modal-funds');
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = db.getCurrentUser();
        const amt = Number(document.getElementById('fund-amount').value);

        if (user && user.role === 'customer' && amt > 0) {
          const newBalance = user.balance + amt;
          const success = db.updateUserBalance(user.id, newBalance);
          
          if (success) {
            ui.showToast(`${ui.formatCurrency(amt)} successfully added to your demo wallet!`, 'success');
            ui.closeModal('modal-funds');
            updateAuthHeaderUI();
            
            // Re-render dashboard if visible
            if (window.location.hash === '#customer/dashboard') {
              router();
            }
          }
        }
      });
    }
  }

  // ----------------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------------
  function init() {
    appView = document.getElementById('app-view');
    
    // Bind routing events
    window.addEventListener('hashchange', router);
    
    // Initial triggers
    updateAuthHeaderUI();
    setupAuthForms();
    setupWalletFunding();
    ui.initModalDismiss();

    // Trigger router on initial load
    router();

    // Setup Navigation Listeners
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-bars');
          icon.classList.toggle('fa-xmark');
        }
      });
    }

    // Modal triggers for login and registration in header
    document.getElementById('btn-login-trigger').addEventListener('click', () => {
      document.getElementById('auth-view-register').style.display = 'none';
      document.getElementById('auth-view-login').style.display = 'block';
      ui.openModal('modal-auth');
    });

    document.getElementById('btn-register-trigger').addEventListener('click', () => {
      document.getElementById('auth-view-login').style.display = 'none';
      document.getElementById('auth-view-register').style.display = 'block';
      ui.openModal('modal-auth');
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
      db.logout();
      ui.showToast('You have been logged out of the platform.', 'info');
      updateAuthHeaderUI();
      window.location.hash = '#customer/explore';
    });

    // Partner/Owner CTA in footer
    const footerOwnerLink = document.getElementById('footer-owner-link');
    if (footerOwnerLink) {
      footerOwnerLink.addEventListener('click', (e) => {
        e.preventDefault();
        const user = db.getCurrentUser();
        if (user && user.role === 'owner') {
          window.location.hash = '#owner/dashboard';
        } else {
          ui.showToast('Please register or log in with a Hotel Owner account to list properties.', 'info');
          document.getElementById('auth-view-login').style.display = 'none';
          document.getElementById('auth-view-register').style.display = 'block';
          // Pre-select owner role
          document.getElementById('register-role').value = 'owner';
          ui.openModal('modal-auth');
        }
      });
    }

    // Init hotel forms inside Owner module scope
    owner.setupHotelRegistrationForm();
  }

  // Load app on document ready
  document.addEventListener('DOMContentLoaded', init);
})();

// ui.js - Shared UI utilities
(function () {
  'use strict';

  window.HotelEase = window.HotelEase || {};

  const ui = {
    // Toast Notification System
    showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type} fade-in`;
      
      let icon = 'fa-check-circle';
      if (type === 'error') icon = 'fa-exclamation-circle';
      if (type === 'warning') icon = 'fa-triangle-exclamation';
      if (type === 'info') icon = 'fa-info-circle';

      toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div class="toast-content">${message}</div>
      `;

      container.appendChild(toast);

      // Trigger fade out
      setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('transitionend', () => {
          toast.remove();
        });
      }, 4000);
    },

    // Render Star Icons based on rating float
    renderStars(rating) {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

      let html = '';
      for (let i = 0; i < fullStars; i++) {
        html += '<i class="fa-solid fa-star star-filled"></i>';
      }
      if (hasHalfStar) {
        html += '<i class="fa-solid fa-star-half-stroke star-filled"></i>';
      }
      for (let i = 0; i < emptyStars; i++) {
        html += '<i class="fa-regular fa-star star-empty"></i>';
      }
      return `<div class="rating-stars" title="${rating} out of 5 stars">${html} <span class="rating-number">${rating.toFixed(1)}</span></div>`;
    },

    // Format numbers to currency
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    },

    // Format dates nicely
    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-US', options);
    },

    // Calculate days between two date strings
    getDaysDifference(start, end) {
      if (!start || !end) return 0;
      const sDate = new Date(start);
      const eDate = new Date(end);
      const diffTime = Math.abs(eDate - sDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },

    // Modal helpers
    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      }
    },

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
      }
    },

    // Setup Modals general dismiss
    initModalDismiss() {
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
          e.target.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    },

    // Handle button loading state
    setLoading(btnElement, isLoading, originalHtml) {
      if (isLoading) {
        btnElement.disabled = true;
        btnElement.dataset.original = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
      } else {
        btnElement.disabled = false;
        btnElement.innerHTML = originalHtml || btnElement.dataset.original || 'Submit';
      }
    }
  };

  window.HotelEase.ui = ui;
})();

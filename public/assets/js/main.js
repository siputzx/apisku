/*
 * Main JavaScript for siputzx API
 * Contains common functionality for all pages
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Handle mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');
    });
  }
  
  // Handle FAQ toggling
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const toggle = item.querySelector('.faq-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const wasActive = item.classList.contains('active');
        // Close all FAQ items
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
        });
        // Open clicked item if it wasn't active
        if (!wasActive) {
          item.classList.add('active');
        }
      });
    }
  });
  
  // Handle form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      // Add loading state to submit buttons
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Processing...';
      }
    });
  });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Utility functions
function showToast(message, type = 'info') {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 toast-${type}`;
  
  // Set colors based on type
  switch(type) {
    case 'success':
      toast.style.background = 'rgba(16, 185, 129, 0.9)';
      break;
    case 'error':
      toast.style.background = 'rgba(239, 68, 68, 0.9)';
      break;
    case 'warning':
      toast.style.background = 'rgba(245, 158, 11, 0.9)';
      break;
    default:
      toast.style.background = 'rgba(59, 130, 246, 0.9)';
  }
  
  toast.style.color = 'white';
  toast.innerHTML = message;
  
  // Add to document
  document.body.appendChild(toast);
  
  // Remove after delay
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Format numbers with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Debounce function for search inputs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
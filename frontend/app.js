const API = "https://sari-sari.onrender.com/api";

/* =====================
   TOKEN & USER HELPERS
===================== */
function getToken() {
    return localStorage.getItem("token");
}

function setToken(token) {
    localStorage.setItem("token", token);
    // Store username from token if available
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.username) {
            localStorage.setItem("username", payload.username);
        }
    } catch (e) {
        // Not a JWT token, ignore
    }
}

function clearToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
}

function getCurrentUser() {
    return localStorage.getItem("username") || 'Student';
}

/* =====================
   ANIMATED NOTIFICATION SYSTEM
===================== */
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Add entrance animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

/* =====================
   WHATSAPP INTEGRATION
===================== */
function openWhatsApp() {
    const phone = "639123456789"; // Philippine format
    const message = "Hello SariSari Hub! I have a question about your products.";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function sendOrderWhatsApp(productName) {
    const phone = "639123456789";
    const message = `Hi SariSari Hub! I'd like to order: ${productName}. My username is ${getCurrentUser()}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

/* =====================
   AUTH GUARD
===================== */
function checkAuth() {
    const token = getToken();
    const page = location.pathname.split("/").pop();

    if (!token && page === "store.html") {
        showNotification('Please login to access the store', 'info');
        setTimeout(() => location.href = "login.html", 1000);
        return;
    }

    if (token && (page === "login.html" || page === "register.html")) {
        setTimeout(() => location.href = "store.html", 500);
        return;
    }
    
    // Update UI for logged in user
    updateUserUI();
}

/* =====================
   UPDATE USER UI
===================== */
function updateUserUI() {
    const user = getCurrentUser();
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    if (user && userAvatar && userName) {
        const firstLetter = user.charAt(0).toUpperCase();
        userAvatar.textContent = firstLetter;
        userName.textContent = user;
        
        // Add welcome message to store page
        const welcomeMsg = document.getElementById('welcome-message');
        if (welcomeMsg) {
            const greetings = ['Hello', 'Welcome back', 'Great to see you', 'Hi there', 'Hey'];
            const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
            welcomeMsg.textContent = `${randomGreeting}, ${user}! 🎉`;
        }
    }
}

/* =====================
   PASSWORD TOGGLE
===================== */
function togglePassword(id) {
    const input = document.getElementById(id);
    const button = input.parentNode.querySelector('.password-toggle');
    const icon = button.querySelector('i');
    
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        button.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        button.setAttribute('aria-label', 'Show password');
    }
}

/* =====================
   REGISTER FUNCTION
===================== */
async function register() {
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!username || !email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API}/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Registration failed');
        }

        showNotification('🎉 Account created successfully! Redirecting to login...', 'success');
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/* =====================
   LOGIN FUNCTION
===================== */
async function login() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
        showNotification('Please enter username and password', 'error');
        return;
    }

    // Show loading state
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API}/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || 'Invalid credentials');
        }

        setToken(data.token);
        showNotification('🎉 Welcome back! Redirecting to store...', 'success');

        setTimeout(() => {
            window.location.href = "store.html";
        }, 1500);

    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/* =====================
   LOGOUT FUNCTION
===================== */
function logout() {
    showNotification('👋 Logged out successfully', 'info');
    clearToken();
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
}

/* =====================
   PRODUCTS DATA WITH ANIMATED ICONS - UPDATED
===================== */
const products = [
    {
        id: 1,
        name: "Assorted Biscuits Pack",
        category: "snacks",
        price: "₱25",
        description: "Mix of cream-filled, wafer, and cracker biscuits. Perfect for quick snacks between classes.",
        icon: "fas fa-cookie-bite fa-bounce",
        color: "#F59E0B",
        tag: "Bestseller"
    },
    {
        id: 2,
        name: "Crispy Potato Chips",
        category: "snacks",
        price: "₱35",
        description: "Crunchy potato chips in BBQ, Cheese, and Sour Cream flavors.",
        icon: "fas fa-pizza-slice fa-shake",
        color: "#DC2626",
        tag: "Popular"
    },
    {
        id: 3,
        name: "Energy Drinks",
        category: "drinks",
        price: "₱50",
        description: "Boost your energy for late-night studying. Red Bull, Monster, and local brands available.",
        icon: "fas fa-battery-full fa-beat",
        color: "#DC2626",
        tag: "Energy Boost"
    },
    {
        id: 4,
        name: "Cold Refreshments",
        category: "drinks",
        price: "₱20-₱35",
        description: "Soft drinks, juices, iced tea, and bottled water. Stay refreshed!",
        icon: "fas fa-glass-whiskey fa-beat",
        color: "#3B82F6",
        tag: "Chilled"
    },
    {
        id: 5,
        name: "Premium Ballpens Set",
        category: "stationery",
        price: "₱25",
        description: "Set of 3 smooth-writing ballpens in different colors for notes.",
        icon: "fas fa-pen fa-fade",
        color: "#10B981",
        tag: "Study Essential"
    },
    {
        id: 6,
        name: "Pencils & Erasers",
        category: "stationery",
        price: "₱15",
        description: "Wooden pencils with quality erasers. Essential for exams.",
        icon: "fas fa-pencil-alt fa-beat-fade",
        color: "#8B5CF6",
        tag: "Must-have"
    },
    {
        id: 7,
        name: "Study Notebooks",
        category: "stationery",
        price: "₱40-₱60",
        description: "Different sizes and types for all your academic needs.",
        icon: "fas fa-book fa-flip",
        color: "#EC4899",
        tag: "Academic"
    },
    {
        id: 8,
        name: "Instant Noodles",
        category: "meals",
        price: "₱18",
        description: "Quick and delicious meals for busy study sessions.",
        icon: "fas fa-bowl-food fa-spin-pulse",
        color: "#F97316",
        tag: "Quick Meal"
    },
    {
        id: 9,
        name: "Bottled Water",
        category: "drinks",
        price: "₱15",
        description: "Pure drinking water to keep you hydrated throughout the day.",
        icon: "fas fa-bottle-water fa-beat",
        color: "#06B6D4",
        tag: "Hydration"
    },
    {
        id: 10,
        name: "Coffee & Hot Drinks",
        category: "drinks",
        price: "₱30-₱55",
        description: "3-in-1 coffee sachets, hot chocolate, and instant cappuccino for those long study nights.",
        icon: "fas fa-mug-saucer fa-bounce",
        color: "#92400E",
        tag: "Wake-Up Call"
    },
    {
        id: 11,
        name: "Highlighters Pack",
        category: "stationery",
        price: "₱30",
        description: "Bright highlighters in different colors for effective studying.",
        icon: "fas fa-highlighter fa-fade",
        color: "#FBBF24",
        tag: "Study Aid"
    },
    {
        id: 12,
        name: "Cup Noodles",
        category: "meals",
        price: "₱25",
        description: "Ready-to-eat cup noodles, just add hot water!",
        icon: "fas fa-mug-hot fa-beat-fade",
        color: "#DC2626",
        tag: "Instant"
    },
    {
        id: 13,
        name: "Sandwich & Burgers",
        category: "meals",
        price: "₱45-₱75",
        description: "Freshly made sandwiches and burgers. Perfect lunch for busy students.",
        icon: "fas fa-burger fa-shake",
        color: "#F59E0B",
        tag: "Fresh Meals"
    },
    {
        id: 14,
        name: "Hand Sanitizer & Wipes",
        category: "hygiene",
        price: "₱35-₱50",
        description: "Keep your hands clean and germ-free. Alcohol-based sanitizers and antibacterial wipes.",
        icon: "fas fa-pump-soap fa-beat",
        color: "#10B981",
        tag: "Stay Safe"
    },
    {
        id: 15,
        name: "Tissue Packs",
        category: "hygiene",
        price: "₱15",
        description: "Pocket tissue packs and facial tissues. Essential for everyday use.",
        icon: "fas fa-box-tissue fa-fade",
        color: "#8B5CF6",
        tag: "Daily Essential"
    },
    {
        id: 16,
        name: "Phone Charger Cables",
        category: "accessories",
        price: "₱80-₱150",
        description: "USB-C, Lightning, and Micro-USB charging cables. Keep your devices powered up!",
        icon: "fas fa-charging-station fa-beat-fade",
        color: "#3B82F6",
        tag: "Tech Essential"
    },
    {
        id: 17,
        name: "Earphones & Headphones",
        category: "accessories",
        price: "₱150-₱350",
        description: "Quality earphones and headphones for music and online classes.",
        icon: "fas fa-headphones fa-spin",
        color: "#EC4899",
        tag: "Audio Gear"
    },
    {
        id: 18,
        name: "Power Bank",
        category: "accessories",
        price: "₱400-₱800",
        description: "Portable power banks 10,000mAh - 20,000mAh. Never run out of battery!",
        icon: "fas fa-battery-three-quarters fa-bounce",
        color: "#10B981",
        tag: "Power Up"
    }
];

/* =====================
   LOAD PRODUCTS WITH ANIMATIONS
===================== */
function loadProducts(filter = 'all') {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    let filteredProducts = products;
    if (filter !== 'all') {
        filteredProducts = products.filter(p => p.category === filter);
    }
    
    productsGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>No products found in this category</h3>
                <p>Try selecting a different category</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.animationDelay = `${index * 0.1}s`;
        
        productCard.innerHTML = `
            <div class="product-badge">${product.tag}</div>
            <div class="product-image" style="background: linear-gradient(135deg, ${product.color}20, ${product.color}40);">
                <i class="${product.icon}" style="color: ${product.color}; font-size: 3.5rem;"></i>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${product.price}</div>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-rating">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star-half-alt"></i>
                        <span>4.5</span>
                    </div>
                    <button class="btn-whatsapp" onclick="sendOrderWhatsApp('${product.name}')" title="Order via WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            </div>
        `;
        
        productsGrid.appendChild(productCard);
    });
    
    // Update product count with animation
    const productCount = document.getElementById('product-count');
    if (productCount) {
        animateCounter(productCount, filteredProducts.length);
    }
}

/* =====================
   ANIMATE COUNTER
===================== */
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 20;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 50);
}

/* =====================
   FILTER PRODUCTS
===================== */
function filterProducts(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load filtered products
    loadProducts(category);
}

/* =====================
   SUBMIT FEEDBACK
===================== */
async function submitFeedback() {
    const message = document.getElementById("feedback-text").value.trim();
    const token = getToken();

    if (!message) {
        showNotification('Please write your feedback first', 'error');
        return;
    }

    if (!token) {
        showNotification('Please login to submit feedback', 'error');
        return;
    }

    const btn = document.querySelector('.feedback-form .btn-primary') || document.querySelector('.btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API}/feedback/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${token}`
            },
            body: JSON.stringify({ message })
        });

        if (!res.ok) {
            throw new Error('Failed to submit feedback');
        }

        document.getElementById("feedback-text").value = "";
        updateCharCount();
        showNotification('✨ Thank you for your valuable feedback!', 'success');
        loadFeedbacks();

    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/* =====================
   LOAD FEEDBACKS WITH ANIMATIONS
===================== */
async function loadFeedbacks() {
    const token = getToken();
    const feedbacksContainer = document.getElementById("feedback-list");
    
    if (!feedbacksContainer) return;

    try {
        const res = await fetch(`${API}/feedback/`, {
            headers: { "Authorization": `Token ${token}` }
        });

        if (!res.ok) {
            throw new Error('Failed to load feedbacks');
        }

        const data = await res.json();
        feedbacksContainer.innerHTML = '';

        if (data.length === 0) {
            feedbacksContainer.innerHTML = `
                <div class="no-feedback">
                    <i class="fas fa-comment-slash"></i>
                    <h4>No feedbacks yet</h4>
                    <p>Be the first to share your thoughts!</p>
                </div>
            `;
            
            const feedbackCount = document.getElementById('feedback-count');
            if (feedbackCount) {
                feedbackCount.textContent = '0';
            }
            return;
        }

        // Sort by date (newest first)
        data.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

        data.forEach((feedback, index) => {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'feedback-item';
            feedbackDiv.style.animationDelay = `${index * 0.1}s`;
            
            const username = feedback.username || getCurrentUser() || 'Student';
            const date = feedback.created_at ? 
                new Date(feedback.created_at).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Just now';
            
            // Generate random avatar color
            const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#2D3047', '#06D6A0', '#EF476F'];
            const color = colors[username.charCodeAt(0) % colors.length];
            
            feedbackDiv.innerHTML = `
                <div class="feedback-meta">
                    <div class="feedback-user">
                        <div class="feedback-avatar" style="background: ${color};">
                            ${username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <strong>${username}</strong>
                            <div class="feedback-date">
                                <i class="far fa-clock"></i> ${date}
                            </div>
                        </div>
                    </div>
                    <div class="feedback-rating">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star-half-alt"></i>
                    </div>
                </div>
                <div class="feedback-content">
                    <i class="fas fa-quote-left"></i>
                    ${feedback.message}
                    <i class="fas fa-quote-right"></i>
                </div>
            `;
            
            feedbacksContainer.appendChild(feedbackDiv);
        });
        
        // Update feedback count with animation
        const feedbackCount = document.getElementById('feedback-count');
        if (feedbackCount) {
            animateCounter(feedbackCount, data.length);
        }

    } catch (error) {
        feedbacksContainer.innerHTML = `
            <div class="no-feedback">
                <i class="fas fa-exclamation-circle"></i>
                <h4>Failed to load feedbacks</h4>
                <p>Please try again later</p>
            </div>
        `;
    }
}

/* =====================
   CHARACTER COUNTER FOR FEEDBACK
===================== */
function updateCharCount() {
    const textarea = document.getElementById('feedback-text');
    const counter = document.getElementById('char-counter');
    if (textarea && counter) {
        const count = textarea.value.length;
        counter.textContent = count;
        counter.style.color = count >= 450 ? '#EF476F' : count >= 400 ? '#FFD166' : '#06D6A0';
    }
}

/* =====================
   INITIALIZE PAGE WITH ANIMATIONS
===================== */
function initializePage() {
    // Check authentication
    checkAuth();
    
    // Load products on store page
    if (window.location.pathname.includes('store.html')) {
        loadProducts();
        loadFeedbacks();
        
        // Setup character counter
        const feedbackTextarea = document.getElementById('feedback-text');
        if (feedbackTextarea) {
            feedbackTextarea.addEventListener('input', updateCharCount);
            updateCharCount();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePage);

// Make functions globally available
window.togglePassword = togglePassword;
window.register = register;
window.login = login;
window.logout = logout;
window.submitFeedback = submitFeedback;
window.filterProducts = filterProducts;
window.openWhatsApp = openWhatsApp;
window.sendOrderWhatsApp = sendOrderWhatsApp;
window.updateCharCount = updateCharCount;

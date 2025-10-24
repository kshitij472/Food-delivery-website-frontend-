// DOM Elements
const navLinks = document.querySelector('.nav-links');
const mobileMenu = document.querySelector('.mobile-menu');
const cartIcon = document.querySelector('.cart-icon');
const cartModal = document.getElementById('cartModal');
const quickViewModal = document.getElementById('quickViewModal');
const orderModal = document.getElementById('orderModal');
const successModal = document.getElementById('successModal');
const overlay = document.getElementById('overlay');
const closeButtons = document.querySelectorAll('.close-modal');
const filterButtons = document.querySelectorAll('.filter-btn');
const menuItems = document.querySelectorAll('.menu-item');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const quickViewButtons = document.querySelectorAll('.quick-view');
const checkoutBtn = document.getElementById('checkoutBtn');
const addToCartFromModal = document.getElementById('addToCartFromModal');
const decreaseQty = document.getElementById('decreaseQty');
const increaseQty = document.getElementById('increaseQty');
const itemQuantity = document.getElementById('itemQuantity');
const tableReservationForm = document.getElementById('tableReservationForm');
const contactForm = document.getElementById('contactForm');
const newsletterForm = document.getElementById('newsletterForm');
const orderForm = document.getElementById('orderForm');
const pickupTimeGroup = document.getElementById('pickupTimeGroup');
const orderType = document.getElementById('orderType');

// Shopping Cart
let cart = [];
let currentQuickViewItem = null;

// Mobile Menu Toggle
mobileMenu.addEventListener('click', () => {
    navLinks.classList.toggle('show');
});

// Close modals when clicking on close buttons
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        cartModal.style.display = 'none';
        quickViewModal.style.display = 'none';
        orderModal.style.display = 'none';
        successModal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === overlay) {
        cartModal.style.display = 'none';
        quickViewModal.style.display = 'none';
        orderModal.style.display = 'none';
        successModal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Open Cart Modal
cartIcon.addEventListener('click', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        try {
            const res = await fetch('http://localhost:5000/api/cart', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            const data = await res.json();
            if (data.items) cart = data.items;
        } catch (err) {
            console.log("Failed to load cart from server");
        }
    }
    renderCart();
    cartModal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
});

// Filter Menu Items
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filter = button.getAttribute('data-filter');
        
        menuItems.forEach(item => {
            if (filter === 'all' || item.getAttribute('data-category') === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Quick View Functionality
quickViewButtons.forEach(button => {
    button.addEventListener('click', () => {
        const itemId = button.getAttribute('data-id');
        const menuItem = document.querySelector(`.menu-item:nth-child(${itemId})`);
        const imgSrc = menuItem.querySelector('img').src;
        const title = menuItem.querySelector('h3').textContent;
        const desc = menuItem.querySelector('.item-desc').textContent;
        const price = menuItem.querySelector('.price').textContent;
        
        currentQuickViewItem = {
            id: itemId,
            name: title,
            price: parseFloat(price.replace('₹', '')),
            image: imgSrc
        };
        
        document.getElementById('quickViewImg').src = imgSrc;
        document.getElementById('quickViewTitle').textContent = title;
        document.getElementById('quickViewDesc').textContent = desc;
        document.getElementById('quickViewPrice').textContent = price;
        document.getElementById('itemQuantity').value = 1;
        
        quickViewModal.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
});

// Quantity Controls in Quick View
decreaseQty.addEventListener('click', () => {
    let qty = parseInt(itemQuantity.value);
    if (qty > 1) {
        itemQuantity.value = qty - 1;
    }
});

increaseQty.addEventListener('click', () => {
    let qty = parseInt(itemQuantity.value);
    if (qty < 20) {
        itemQuantity.value = qty + 1;
    }
});

// Add to Cart from Quick View
addToCartFromModal.addEventListener('click', () => {
    if (currentQuickViewItem) {
        const quantity = parseInt(itemQuantity.value);
        addToCart(currentQuickViewItem.id, currentQuickViewItem.name, currentQuickViewItem.price, quantity);
        quickViewModal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        showSuccessMessage(`${quantity} ${currentQuickViewItem.name} added to cart!`);
    }
});

// Add to Cart from Menu
addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
        const id = button.getAttribute('data-id');
        const name = button.getAttribute('data-name');
        const price = parseFloat(button.getAttribute('data-price'));
        addToCart(id, name, price, 1);
        
        showSuccessMessage(`${name} added to cart!`);
    });
});

// Add Item to Cart
function addToCart(id, name, price, quantity) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id,
            name,
            price,
            quantity
        });
    }
    
    updateCartCount();

    // Save to backend if logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        fetch('http://localhost:5000/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ items: cart })
        }).catch(err => console.log("Save cart failed"));
    }
}

// Update Cart Count Display
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

// Render Cart Items
function renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const totalAmountElement = document.getElementById('totalAmount');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        totalAmountElement.textContent = '₹0';
        return;
    }
    
    let cartHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="cart-item-total">₹${itemTotal}</div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = cartHTML;
    totalAmountElement.textContent = `₹${total}`;
    
    // Add event listeners to quantity buttons
    document.querySelectorAll('.decrease').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            updateCartItemQuantity(id, -1);
        });
    });
    
    document.querySelectorAll('.increase').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            updateCartItemQuantity(id, 1);
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            removeCartItem(id);
        });
    });
}

// Update Cart Item Quantity
function updateCartItemQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeCartItem(id);
        } else {
            renderCart();
            updateCartCount();

            // Save to backend
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                fetch('http://localhost:5000/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': localStorage.getItem('token')
                    },
                    body: JSON.stringify({ items: cart })
                }).catch(err => console.log("Save cart failed"));
            }
        }
    }
}

// Remove Item from Cart
function removeCartItem(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
    updateCartCount();

    // Save to backend
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        fetch('http://localhost:5000/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ items: cart })
        }).catch(err => console.log("Save cart failed"));
    }
}

// Checkout Button
checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        showSuccessMessage('Your cart is empty!', true);
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        try {
            await fetch('http://localhost:5000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({ items: cart })
            });
        } catch (err) {
            console.log("Failed to sync cart before checkout");
        }
    }

    cartModal.style.display = 'none';
    renderOrderSummary();
    orderModal.style.display = 'block';
});

// Render Order Summary
function renderOrderSummary() {
    const orderItemsSummary = document.getElementById('orderItemsSummary');
    const orderTotalAmount = document.getElementById('orderTotalAmount');
    
    let summaryHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        summaryHTML += `
            <div class="order-item">
                <span class="order-item-name">${item.name} x ${item.quantity}</span>
                <span class="order-item-price">₹${itemTotal}</span>
            </div>
        `;
    });
    
    orderItemsSummary.innerHTML = summaryHTML;
    orderTotalAmount.textContent = `₹${total}`;
}

// Toggle Pickup Time Field
orderType.addEventListener('change', () => {
    if (orderType.value === 'pickup') {
        pickupTimeGroup.style.display = 'block';
    } else {
        pickupTimeGroup.style.display = 'none';
    }
});

// Handle Form Submissions
if (tableReservationForm) {
    tableReservationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            date: formData.get('date'),
            time: formData.get('time'),
            guests: formData.get('guests'),
            specialRequests: formData.get('special')
        };

        try {
            const res = await fetch('http://localhost:5000/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                showSuccessMessage(`Thank you ${data.name}! Your table has been reserved.`);
                tableReservationForm.reset();
            } else {
                alert("Reservation failed. Try again.");
            }
        } catch (err) {
            alert("Something went wrong!");
        }
    });
}

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = {
            contactName: formData.get('contactName'),
            contactEmail: formData.get('contactEmail'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        try {
            const res = await fetch('http://localhost:5000/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                showSuccessMessage(`Thank you ${data.contactName}! We'll get back to you soon.`);
                contactForm.reset();
            } else {
                alert("Failed to send message.");
            }
        } catch (err) {
            alert("Something went wrong!");
        }
    });
}

if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.querySelector('#newsletterForm input').value;
        showSuccessMessage(`Thank you! Subscribed with ${email}.`);
        newsletterForm.reset();
    });
}

if (orderForm) {
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const customerName = formData.get('customerName');
        const phone = formData.get('customerPhone');
        const email = formData.get('customerEmail');
        const address = formData.get('deliveryAddress');
        const orderType = formData.get('orderType');

        const user = JSON.parse(localStorage.getItem('user'));

        try {
            const res = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({
                    customerName, phone, email, address, orderType,
                    items: cart,
                    totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                })
            });

            if (res.ok) {
                cart = [];
                updateCartCount();
                showSuccessMessage(`Thank you ${customerName}! Your order has been placed successfully.`);
                orderForm.reset();
                orderModal.style.display = 'none';
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            } else {
                alert("Order failed. Try again.");
            }
        } catch (err) {
            alert("Something went wrong!");
        }
    });
}

// Show Success Message
function showSuccessMessage(message, isError = false) {
    const successMessage = document.getElementById('successMessage');
    const successIcon = document.querySelector('.success-icon i');
    
    successMessage.textContent = message;
    
    if (isError) {
        successIcon.className = 'fas fa-exclamation-circle';
        successIcon.style.color = '#e74c3c';
        document.getElementById('successOkBtn').style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    } else {
        successIcon.className = 'fas fa-check-circle';
        successIcon.style.color = '#27ae60';
        document.getElementById('successOkBtn').style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    }
    
    successModal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close Success Modal
document.getElementById('successOkBtn').addEventListener('click', () => {
    successModal.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Scroll Animation for Menu Items
function animateMenuItems() {
    const menuItems = document.querySelectorAll('.menu-item');
    const menuSection = document.querySelector('.menu-section');
    
    const menuSectionTop = menuSection.offsetTop;
    const triggerPoint = menuSectionTop - window.innerHeight + 200;
    
    if (window.scrollY > triggerPoint) {
        menuItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('appear');
            }, index * 100);
        });
    }
}

// Header Scroll Effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    animateMenuItems();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        menuItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('appear');
            }, index * 100);
        });
    }, 500);
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    document.getElementById('pickupTime').setAttribute('min', currentTimeString);

    // Check login status
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser")) || JSON.parse(localStorage.getItem("user"));
    if(loggedUser) {
      localStorage.setItem("user", JSON.stringify(loggedUser));
      const authBox = document.querySelector(".auth-buttons");
      authBox.innerHTML = `
        <span style="color:#333; margin-right:10px;">👤 ${loggedUser.name}</span>
        <button id="logoutBtn">Logout</button>
      `;
      
      document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loggedInUser");
        location.reload();
      });
    }
});

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            if (navLinks.classList.contains('show')) {
                navLinks.classList.remove('show');
            }
        }
    });
});

// ===== LOGIN & SIGNUP =====
const signupModal = document.getElementById("signupModal");
const loginModal = document.getElementById("loginModal");
const openSignup = document.getElementById("openSignup");
const openLogin = document.getElementById("openLogin");

if(openSignup){
  openSignup.onclick = () => {
    signupModal.style.display = "block";
    overlay.style.display = "block";
  };
}
if(openLogin){
  openLogin.onclick = () => {
    loginModal.style.display = "block";
    overlay.style.display = "block";
  };
}

overlay.addEventListener("click", () => {
  signupModal.style.display = "none";
  loginModal.style.display = "none";
});

// Signup
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const pass = document.getElementById("signupPassword").value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("Signup successful! Welcome " + data.user.name);
      signupModal.style.display = "none";
      overlay.style.display = "none";
      location.reload();
    } else {
      alert(data.msg);
    }
  } catch (err) {
    alert("Something went wrong!");
  }
});

// Login
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("Welcome back " + data.user.name);
      loginModal.style.display = "none";
      overlay.style.display = "none";
      location.reload();
    } else {
      alert(data.msg);
    }
  } catch (err) {
    alert("Login failed!");
  }
});
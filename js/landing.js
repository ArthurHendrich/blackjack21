// Landing page functionality

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const playAsGuestBtn = document.getElementById("play-as-guest")
  const loginBtn = document.getElementById("login-btn")
  const registerBtn = document.getElementById("register-btn")
  const loginModal = document.getElementById("login-modal")
  const registerModal = document.getElementById("register-modal")
  const closeModals = document.querySelectorAll(".close-modal")
  const switchToRegister = document.getElementById("switch-to-register")
  const switchToLogin = document.getElementById("switch-to-login")
  const loginForm = document.getElementById("login-form")
  const registerForm = document.getElementById("register-form")

  // Set up event listeners
  playAsGuestBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Play as guest clicked");
    handlePlayAsGuest();
  });

  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Login button clicked");
    openModal(loginModal);
  });

  registerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Register button clicked");
    openModal(registerModal);
  });

  closeModals.forEach((closeBtn) => {
    closeBtn.addEventListener("click", () => {
      closeModal(closeBtn.closest(".modal"))
    })
  })

  switchToRegister.addEventListener("click", (e) => {
    e.preventDefault()
    closeModal(loginModal)
    openModal(registerModal)
  })

  switchToLogin.addEventListener("click", (e) => {
    e.preventDefault()
    closeModal(registerModal)
    openModal(loginModal)
  })

  loginForm.addEventListener("submit", handleLogin)
  registerForm.addEventListener("submit", handleRegister)

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target)
    }
  })

  // Handle play as guest
  function handlePlayAsGuest() {
    // Create a guest user
    const guestId = `guest_${Date.now()}`;
    const guestUser = {
      id: guestId,
      username: `Guest_${Math.floor(Math.random() * 1000)}`,
      isGuest: true,
    };

    // Store guest user in localStorage
    localStorage.setItem("blackjack_user", JSON.stringify(guestUser));

    // Redirect to play.html
    window.location.href = "play.html";
  }

  // Handle login
  function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    // Use Auth module if available
    if (window.Auth && window.Auth.login) {
      // Nova versão retorna booleano
      const success = window.Auth.login(username, password);
      if (success) {
        window.location.href = "lobby.html";
      } else {
        alert("Login failed. Please check your username and password.");
      }
    } else {
      // Fallback para testes
      const users = JSON.parse(localStorage.getItem("blackjack_users") || "[]");
      const user = users.find((u) => u.username === username && u.password === password);

      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem("blackjack_current_user", JSON.stringify(userWithoutPassword));
        window.location.href = "lobby.html";
      } else {
        alert("Invalid username or password");
      }
    }
  }

  // Handle register
  function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm-password").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Criar um novo usuário usando o Auth
    if (window.Auth) {
      // Criar usuário no localStorage
      const user = {
        id: `user_${Date.now()}`,
        username,
        email,
        password, // Em um app real, isso seria hash
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem("blackjack_user", JSON.stringify(user));
      alert("Registration successful!");
      window.location.href = "lobby.html";
    } else {
      // Fallback para testes
      const users = JSON.parse(localStorage.getItem("blackjack_users") || "[]");

      if (users.some((u) => u.username === username)) {
        alert("Username already taken");
        return;
      }

      if (users.some((u) => u.email === email)) {
        alert("Email already registered");
        return;
      }

      const newUser = {
        id: `user_${Date.now()}`,
        username,
        email,
        password,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem("blackjack_users", JSON.stringify(users));

      const { password: _, ...userWithoutPassword } = newUser;
      localStorage.setItem("blackjack_current_user", JSON.stringify(userWithoutPassword));
      window.location.href = "lobby.html";
    }
  }

  // Open modal
  function openModal(modal) {
    console.log("Opening modal:", modal);
    modal.classList.add("active");
    console.log("Modal class list after open:", modal.classList);
  }

  // Close modal
  function closeModal(modal) {
    console.log("Closing modal:", modal);
    modal.classList.remove("active");
    console.log("Modal class list after close:", modal.classList);
  }
})

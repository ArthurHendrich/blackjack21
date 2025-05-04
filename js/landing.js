// Landing page functionality

document.addEventListener("DOMContentLoaded", () => {
  console.log("Landing page loaded")

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

  // Debug - check if elements are found
  console.log("Login button:", loginBtn ? "Found" : "Not found")
  console.log("Register button:", registerBtn ? "Found" : "Not found")
  console.log("Login modal:", loginModal ? "Found" : "Not found")
  console.log("Register modal:", registerModal ? "Found" : "Not found")

  // Set up event listeners
  if (playAsGuestBtn) {
    playAsGuestBtn.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("Play as guest clicked")
      handlePlayAsGuest()
    })
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("Login button clicked")
      openModal(loginModal)
    })
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("Register button clicked")
      openModal(registerModal)
    })
  }

  closeModals.forEach((closeBtn) => {
    closeBtn.addEventListener("click", () => {
      closeModal(closeBtn.closest(".modal"))
    })
  })

  if (switchToRegister) {
    switchToRegister.addEventListener("click", (e) => {
      e.preventDefault()
      closeModal(loginModal)
      openModal(registerModal)
    })
  }

  if (switchToLogin) {
    switchToLogin.addEventListener("click", (e) => {
      e.preventDefault()
      closeModal(registerModal)
      openModal(loginModal)
    })
  }

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister)
  }

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target)
    }
  })

  // Handle play as guest
  function handlePlayAsGuest() {
    // Create a guest user
    const guestId = `guest_${Date.now()}`
    const guestUser = {
      id: guestId,
      username: `Guest_${Math.floor(Math.random() * 1000)}`,
      isGuest: true,
    }

    // Store guest user in localStorage - use consistent key
    localStorage.setItem("blackjack_current_user", JSON.stringify(guestUser))
    console.log("Guest user created:", guestUser)

    // Redirect to play.html
    window.location.href = "play.html"
  }

  // Handle login
  function handleLogin(e) {
    e.preventDefault()
    console.log("Login form submitted")

    const username = document.getElementById("login-username").value
    const password = document.getElementById("login-password").value

    // Use Auth module if available
    if (window.Auth && window.Auth.login) {
      console.log("Using Auth module for login")
      const success = window.Auth.login(username, password)
      if (success) {
        console.log("Login successful, redirecting to lobby")
        // Small delay to allow auth state to update
        setTimeout(() => {
          window.location.href = "lobby.html"
        }, 100)
      } else {
        console.log("Login failed")
        alert("Login failed. Please check your username and password.")
      }
    } else {
      console.log("Auth module not available, using fallback")
      // Fallback for testing
      const users = JSON.parse(localStorage.getItem("blackjack_users") || "[]")
      const user = users.find((u) => u.username === username && u.password === password)

      if (user) {
        const { password: _, ...userWithoutPassword } = user
        localStorage.setItem("blackjack_current_user", JSON.stringify(userWithoutPassword))
        window.location.href = "lobby.html"
      } else {
        alert("Invalid username or password")
      }
    }
  }

  // Handle register
  function handleRegister(e) {
    e.preventDefault()
    console.log("Register form submitted")

    const username = document.getElementById("register-username").value
    const email = document.getElementById("register-email").value
    const password = document.getElementById("register-password").value
    const confirmPassword = document.getElementById("register-confirm-password").value

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    // Use Auth module if available
    if (window.Auth && window.Auth.register) {
      console.log("Using Auth module for registration")
      window.Auth.register(username, email, password)
        .then((user) => {
          console.log("Registration successful:", user)
          alert("Registration successful!")
          // Small delay to allow auth state to update
          setTimeout(() => {
            window.location.href = "lobby.html"
          }, 100)
        })
        .catch((error) => {
          console.error("Registration error:", error)
          alert(error.message)
        })
    } else {
      console.log("Auth module not available, using fallback")
      // Fallback for testing
      const users = JSON.parse(localStorage.getItem("blackjack_users") || "[]")

      if (users.some((u) => u.username === username)) {
        alert("Username already taken")
        return
      }

      if (users.some((u) => u.email === email)) {
        alert("Email already registered")
        return
      }

      const newUser = {
        id: `user_${Date.now()}`,
        username,
        email,
        password,
        createdAt: new Date().toISOString(),
      }

      users.push(newUser)
      localStorage.setItem("blackjack_users", JSON.stringify(users))

      const { password: _, ...userWithoutPassword } = newUser
      localStorage.setItem("blackjack_current_user", JSON.stringify(userWithoutPassword))

      alert("Registration successful!")
      window.location.href = "lobby.html"
    }
  }

  // Open modal
  function openModal(modal) {
    console.log("Opening modal:", modal?.id)
    if (!modal) {
      console.error("Modal element not found")
      return
    }
    modal.classList.add("active")
    console.log("Modal class list after open:", modal.className)
  }

  // Close modal
  function closeModal(modal) {
    console.log("Closing modal:", modal?.id)
    if (!modal) {
      console.error("Modal element not found")
      return
    }
    modal.classList.remove("active")
    console.log("Modal class list after close:", modal.className)
  }
})

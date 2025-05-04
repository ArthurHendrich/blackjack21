// Authentication module

const Auth = (() => {
  // Private variables
  let currentUser = null
  let isAuthenticated = false
  let authListeners = []

  // Generate a random user ID if none exists
  const generateUserId = () => {
    return "user_" + Math.random().toString(36).substr(2, 9)
  }

  // Initialize authentication
  const init = () => {
    console.log("Auth module initializing...")
    // Check if user is already logged in - use consistent key
    const storedUser = localStorage.getItem("blackjack_current_user")
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser)
        isAuthenticated = true
        console.log("User found in localStorage, authenticated:", currentUser.username)
        notifyListeners()
      } catch (error) {
        console.error("Error parsing stored user:", error)
        logout() // Clear invalid data
      }
    } else {
      console.log("No user found in localStorage, not authenticated")
    }
  }

  // Register a new user
  const register = (username, email, password) => {
    console.log("Registering new user:", username, email)
    return new Promise((resolve, reject) => {
      // Get existing users
      const users = JSON.parse(localStorage.getItem("blackjack_users") || "[]")

      // Check if username or email already exists
      if (users.some((user) => user.username === username)) {
        reject({ message: "Username already taken" })
        return
      }

      if (users.some((user) => user.email === email)) {
        reject({ message: "Email already registered" })
        return
      }

      // Create new user
      const newUser = {
        id: generateUserId(),
        username,
        email,
        password, // In a real app, this would be hashed
        createdAt: new Date().toISOString(),
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          blackjacks: 0,
        },
        achievements: [],
        gameHistory: [],
      }

      // Add user to storage
      users.push(newUser)
      localStorage.setItem("blackjack_users", JSON.stringify(users))

      // Set as current user (without password)
      const { password: _, ...userWithoutPassword } = newUser
      currentUser = userWithoutPassword
      isAuthenticated = true
      localStorage.setItem("blackjack_current_user", JSON.stringify(currentUser))
      console.log("User registered and authenticated:", currentUser.username)

      // Notify listeners
      notifyListeners()

      resolve(currentUser)
    })
  }

  // Get current user data - use consistent key
  const getCurrentUser = () => {
    return currentUser || JSON.parse(localStorage.getItem("blackjack_current_user") || "null")
  }

  // Log in user
  const login = (username, password) => {
    console.log("Auth.login called with:", username, password)

    // For demo, check if username and password are not empty
    if (!username || !password) {
      console.log("Login failed: username or password empty")
      return false
    }

    // Check against existing users
    const users = JSON.parse(localStorage.getItem("blackjack_users") || "[]")
    const user = users.find((u) => u.username === username && u.password === password)

    if (!user) {
      // If no matching user, create one for demo purposes
      // In a real app, you would return false here
      console.log("Creating new user for demo purposes")
      const newUser = {
        id: generateUserId(),
        username: username,
        password: password, // Note: In a real app, never store plain passwords
        avatar: "assets/avatars/avatar-1.png",
        createdAt: new Date().toISOString(),
      }

      // Add to users array
      users.push(newUser)
      localStorage.setItem("blackjack_users", JSON.stringify(users))

      // Set as current user (without password)
      const { password: _, ...userWithoutPassword } = newUser
      currentUser = userWithoutPassword
      isAuthenticated = true
      localStorage.setItem("blackjack_current_user", JSON.stringify(currentUser))
    } else {
      // User found, set as current user
      const { password: _, ...userWithoutPassword } = user
      currentUser = userWithoutPassword
      isAuthenticated = true
      localStorage.setItem("blackjack_current_user", JSON.stringify(currentUser))
    }

    console.log("User logged in successfully:", currentUser.username)

    // Notify listeners
    notifyListeners()

    return true
  }

  // Log out user
  const logout = () => {
    console.log("Logging out user")
    localStorage.removeItem("blackjack_current_user")
    currentUser = null
    isAuthenticated = false
    notifyListeners()
    return true
  }

  // Check if user is logged in
  const isLoggedIn = () => {
    return isAuthenticated || !!getCurrentUser()
  }

  // Update user data
  const updateUser = (userData) => {
    console.log("Updating user data:", userData)
    return new Promise((resolve, reject) => {
      if (!isAuthenticated || !currentUser) {
        reject({ message: "Not authenticated" })
        return
      }

      // Get users
      const users = JSON.parse(localStorage.getItem("blackjack_users") || "[]")
      const userIndex = users.findIndex((user) => user.id === currentUser.id)

      if (userIndex === -1) {
        reject({ message: "User not found" })
        return
      }

      // Update user data
      const updatedUser = { ...users[userIndex], ...userData }
      users[userIndex] = updatedUser
      localStorage.setItem("blackjack_users", JSON.stringify(users))

      // Update current user (without password)
      const { password: _, ...userWithoutPassword } = updatedUser
      currentUser = userWithoutPassword
      localStorage.setItem("blackjack_current_user", JSON.stringify(currentUser))
      console.log("User data updated:", currentUser.username)

      // Notify listeners
      notifyListeners()

      resolve(currentUser)
    })
  }

  // Add authentication listener
  const addAuthListener = (listener) => {
    authListeners.push(listener)
    // Call immediately with current state
    listener(isAuthenticated, currentUser)
  }

  // Remove authentication listener
  const removeAuthListener = (listener) => {
    authListeners = authListeners.filter((l) => l !== listener)
  }

  // Notify all listeners
  const notifyListeners = () => {
    authListeners.forEach((listener) => listener(isAuthenticated, currentUser))
  }

  // Initialize on load
  init()

  // Public API
  return {
    register,
    login,
    logout,
    getCurrentUser,
    isLoggedIn,
    updateUser,
    addAuthListener,
    removeAuthListener,
  }
})()

// Make Auth available globally
window.Auth = Auth

// Handle authentication state on page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, checking auth state")

  // Check if we need to redirect based on auth state
  const currentPath = window.location.pathname
  const publicPaths = ["/index.html", "/", "/login.html", "/register.html"]
  const isPublicPath = publicPaths.some((path) => currentPath.endsWith(path))

  console.log("Current path:", currentPath, "Is public path:", isPublicPath)

  // Fix the redirect logic to prevent loops
  Auth.addAuthListener((isAuthenticated, user) => {
    console.log("Auth state changed - Authenticated:", isAuthenticated, "User:", user?.username)

    const usernameElement = document.getElementById("display-username")
    if (usernameElement && user) {
      usernameElement.textContent = user.username
    }

    // Only redirect if we're sure about the authentication state
    // and avoid redirecting when already on the correct page
    if (!isAuthenticated && !isPublicPath) {
      console.log("Not authenticated and on protected page, redirecting to index.html")
      window.location.href = "index.html"
    } else if (isAuthenticated && isPublicPath && currentPath !== "/" && !window.location.href.includes("lobby.html")) {
      console.log("Authenticated and on public page, redirecting to lobby.html")
      window.location.href = "lobby.html"
    }
  })

  // Handle logout button
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      Auth.logout()
      window.location.href = "index.html"
    })
  }
})

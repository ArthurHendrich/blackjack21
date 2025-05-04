// Authentication module

const Auth = (() => {
  // Private variables
  let currentUser = null
  let isAuthenticated = false
  let authListeners = []

  // Generate a random user ID if none exists
  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  };

  // Initialize authentication
  const init = () => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("blackjack_current_user")
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser)
        isAuthenticated = true
        notifyListeners()
      } catch (error) {
        console.error("Error parsing stored user:", error)
        logout() // Clear invalid data
      }
    }
  }

  // Register a new user
  const register = (username, email, password) => {
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
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

        // Notify listeners
        notifyListeners()

        resolve(currentUser)
      }, 1000)
    })
  }

  // Get current user data
  const getCurrentUser = () => {
    // Get user from localStorage or create default
    const userData = JSON.parse(localStorage.getItem("blackjack_user") || "null");
    
    if (!userData) {
      return null;
    }
    
    // Ensure user always has an ID
    if (!userData.id) {
      userData.id = generateUserId();
      localStorage.setItem("blackjack_user", JSON.stringify(userData));
    }
    
    return userData;
  };

  // Log in user
  const login = (username, password) => {
    console.log("Auth.login chamado com:", username, password);
    
    // For demo, just check if username and password are not empty
    if (!username || !password) {
      console.log("Login falhou: username ou password vazios");
      return false;
    }

    // Create user object
    const user = {
      id: generateUserId(),
      username: username,
      password: password, // Note: In a real app, never store plain passwords
      avatar: "assets/avatars/avatar-1.png",
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage
    localStorage.setItem("blackjack_user", JSON.stringify(user));
    console.log("Usuário logado com sucesso:", user);
    
    return true;
  };

  // Log out user
  const logout = () => {
    localStorage.removeItem("blackjack_user");
    return true;
  };

  // Check if user is logged in
  const isLoggedIn = () => {
    return !!getCurrentUser();
  };

  // Update user data
  const updateUser = (userData) => {
    return new Promise((resolve, reject) => {
      if (!isAuthenticated || !currentUser) {
        reject({ message: "Not authenticated" })
        return
      }

      // Simulate API call delay
      setTimeout(() => {
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

        // Notify listeners
        notifyListeners()

        resolve(currentUser)
      }, 1000)
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
  // Check if we need to redirect based on auth state
  const currentPath = window.location.pathname
  const publicPaths = ["/index.html", "/", "/login.html", "/register.html"]
  const isPublicPath = publicPaths.some((path) => currentPath.endsWith(path))

  Auth.addAuthListener((isAuthenticated, user) => {
    const usernameElement = document.getElementById("display-username")
    if (usernameElement && user) {
      usernameElement.textContent = user.username
    }

    // Handle redirects based on authentication state
    if (!isAuthenticated && !isPublicPath) {
      // Redirect to login if not authenticated and trying to access protected page
      window.location.href = "index.html"
    } else if (isAuthenticated && isPublicPath && currentPath !== "/") {
      // Redirect to lobby if authenticated and on login/register page
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

// WebSocket client for BlackjackPro

const WebSocketClient = (() => {
  // Constants
  const RECONNECT_DELAY = 2000 // 2 segundos
  const MAX_RECONNECT_ATTEMPTS = 5

  // Connection status enum
  const ConnectionStatus = {
    DISCONNECTED: "disconnected",
    CONNECTING: "connecting",
    CONNECTED: "connected",
  }

  // Private variables
  let socket = null
  let currentUser = null
  const eventListeners = {}
  let connectionStatus = ConnectionStatus.DISCONNECTED
  let reconnectAttempts = 0
  let reconnectTimer = null
  const serverUrl = window.location.origin // Use the same origin as the page

  // Initialize WebSocket connection
  function init(user) {
    if (!user || !user.id || !user.username) {
      console.error("Invalid user data for WebSocket initialization")
      return
    }

    currentUser = user
    connect()
  }

  // Connect to WebSocket server
  function connect() {
    if (socket) {
      // Clean up existing socket
      socket.removeAllListeners()
      socket.disconnect()
    }

    connectionStatus = ConnectionStatus.CONNECTING
    console.log("Connecting to WebSocket server...")

    // Create new socket connection
    socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      timeout: 10000,
    })

    // Set up event listeners
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)
    socket.on("error", handleError)

    // Set up game event listeners
    socket.on("gameState", (data) => triggerEvent("gameState", data))
    socket.on("tablesUpdated", (data) => triggerEvent("tablesUpdated", data))
    socket.on("onlineUsersUpdated", (data) => triggerEvent("onlineUsersUpdated", data))
    socket.on("tableCreated", (data) => triggerEvent("tableCreated", data))
    socket.on("tableJoined", (data) => triggerEvent("tableJoined", data))
    socket.on("tableLeft", () => triggerEvent("tableLeft"))
    socket.on("playerJoined", (data) => {
      console.log("Evento playerJoined recebido:", data)
      triggerEvent("playerJoined", data)
    })
    socket.on("playerLeft", (data) => triggerEvent("playerLeft", data))
    socket.on("gameStarted", (data) => triggerEvent("gameStarted", data))
    socket.on("gameActionReceived", (data) => triggerEvent("gameActionReceived", data))
    socket.on("globalMessageReceived", (data) => triggerEvent("globalMessageReceived", data))
    socket.on("tableMessageReceived", (data) => triggerEvent("tableMessageReceived", data))
    socket.on("userLeft", (data) => triggerEvent("userLeft", data))
  }

  // Handle successful connection
  function handleConnect() {
    console.log("WebSocket connected")
    connectionStatus = ConnectionStatus.CONNECTED
    reconnectAttempts = 0

    // Authenticate with the server
    if (currentUser) {
      socket.emit("authenticate", currentUser)
    }

    // Trigger connected event
    triggerEvent("connected")
  }

  // Handle disconnection
  function handleDisconnect(reason) {
    console.log("WebSocket disconnected:", reason)
    connectionStatus = ConnectionStatus.DISCONNECTED

    // Trigger disconnected event
    triggerEvent("disconnected", { reason })

    // Attempt to reconnect if not closing or server disconnect
    if (reason !== "io client disconnect" && reason !== "io server disconnect") {
      attemptReconnect()
    }
  }

  // Handle connection error
  function handleConnectError(error) {
    console.error("WebSocket connection error:", error)
    connectionStatus = ConnectionStatus.DISCONNECTED

    // Trigger error event
    triggerEvent("error", { message: "Connection error", error })

    // Attempt to reconnect
    attemptReconnect()
  }

  // Handle general error
  function handleError(error) {
    console.error("WebSocket error:", error)

    // Trigger error event
    triggerEvent("error", error)
  }

  // Attempt to reconnect
  function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("Max reconnect attempts reached")
      return
    }

    reconnectAttempts++

    // Clear any existing reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }

    // Set up new reconnect timer
    const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1) // Exponential backoff
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts})`)

    reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${reconnectAttempts})`)
      connect()
    }, delay)
  }

  // Send message to server
  function send(event, data) {
    if (!socket || connectionStatus !== ConnectionStatus.CONNECTED) {
      console.error("Cannot send message, socket not connected")
      return false
    }

    socket.emit(event, data)
    return true
  }

  // Add event listener
  function addEventListener(event, callback) {
    if (!eventListeners[event]) {
      eventListeners[event] = []
    }

    eventListeners[event].push(callback)
  }

  // Remove event listener
  function removeEventListener(event, callback) {
    if (!eventListeners[event]) {
      return
    }

    eventListeners[event] = eventListeners[event].filter((cb) => cb !== callback)
  }

  // Trigger event
  function triggerEvent(event, data) {
    if (!eventListeners[event]) {
      return
    }

    eventListeners[event].forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in ${event} event handler:`, error)
      }
    })
  }

  // Get connection status
  function getConnectionStatus() {
    return connectionStatus
  }

  // Public API
  return {
    init,
    send,
    addEventListener,
    removeEventListener,
    getConnectionStatus,
    ConnectionStatus,
  }
})()

// Make WebSocketClient available globally
window.WebSocketClient = WebSocketClient

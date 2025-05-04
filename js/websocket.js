// WebSocket implementation for real-time multiplayer functionality

const WebSocketClient = (() => {
  // Private variables
  let socket = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  let reconnectTimeout = null
  const eventListeners = {}
  let userId = null
  let username = null
  let currentTableId = null

  // Connection status
  const ConnectionStatus = {
    CONNECTING: "connecting",
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
    RECONNECTING: "reconnecting",
  }

  let connectionStatus = ConnectionStatus.DISCONNECTED

  // Initialize WebSocket connection
  const init = (user) => {
    if (user && user.id && user.username) {
      userId = user.id
      username = user.username

      // Conectar ao servidor Socket.io
      connectToServer()

      return true
    }
    return false
  }

  // Connect to Socket.io server
  const connectToServer = () => {
    connectionStatus = ConnectionStatus.CONNECTING
    triggerEvent("connectionStatusChanged", connectionStatus)

    // Detectar automaticamente o endereço do servidor
    const serverUrl = getServerUrl()

    try {
      // Conectar ao servidor Socket.io
      socket = io(serverUrl)

      // Set up Socket.io event listeners
      socket.on("connect", () => {
        connectionStatus = ConnectionStatus.CONNECTED
        triggerEvent("connectionStatusChanged", connectionStatus)
        triggerEvent("connected")

        // Autenticar com o servidor
        socket.emit("authenticate", {
          username: username,
        })

        console.log(`Conectado ao servidor: ${serverUrl}`)
      })

      socket.on("disconnect", () => {
        connectionStatus = ConnectionStatus.DISCONNECTED
        triggerEvent("connectionStatusChanged", connectionStatus)
        triggerEvent("disconnected")

        // Tentar reconectar
        attemptReconnect()
      })

      socket.on("error", (error) => {
        console.error("Socket.io error:", error)
        triggerEvent("error", { message: "Erro de conexão" })
      })

      // Game state events
      socket.on("gameState", (state) => {
        console.log("Recebido evento gameState:", state);
        triggerEvent("gameStateReceived", state);
      })

      socket.on("onlineUsersUpdated", (users) => {
        console.log("Recebido evento onlineUsersUpdated:", users);
        triggerEvent("onlineUsersUpdated", users);
      })

      socket.on("tablesUpdated", (tables) => {
        console.log("Recebido evento tablesUpdated:", tables);
        triggerEvent("tablesUpdated", tables);
      })

      socket.on("tableCreated", (table) => {
        console.log("Recebido evento tableCreated:", table);
        currentTableId = table.id;
        triggerEvent("tableCreated", table);
      })

      socket.on("tableJoined", (table) => {
        currentTableId = table.id
        triggerEvent("tableJoined", table)
      })

      socket.on("tableLeft", () => {
        currentTableId = null
        triggerEvent("tableLeft")
      })

      socket.on("gameStarted", (gameState) => {
        triggerEvent("gameStarted", gameState)
      })

      socket.on("gameActionReceived", (action) => {
        triggerEvent("gameActionReceived", action)
      })

      socket.on("tableMessageReceived", (message) => {
        triggerEvent("tableMessageReceived", message)
      })

      socket.on("globalMessageReceived", (message) => {
        triggerEvent("globalMessageReceived", message)
      })

      socket.on("error", (error) => {
        triggerEvent("error", error)
      })
    } catch (error) {
      console.error("Failed to connect to Socket.io server:", error)
      connectionStatus = ConnectionStatus.DISCONNECTED
      triggerEvent("connectionStatusChanged", connectionStatus)
      triggerEvent("error", { message: "Falha ao conectar ao servidor" })

      // Tentar reconectar
      attemptReconnect()
    }
  }

  // Get server URL
  const getServerUrl = () => {
    // Tentar obter o endereço do servidor a partir da URL atual
    const currentUrl = window.location.href
    const url = new URL(currentUrl)
    return `${url.protocol}//${url.hostname}:3000` // Porta padrão 3000
  }

  // Attempt to reconnect
  const attemptReconnect = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++
      connectionStatus = ConnectionStatus.RECONNECTING
      triggerEvent("connectionStatusChanged", connectionStatus)

      console.log(`Tentando reconectar (${reconnectAttempts}/${maxReconnectAttempts})...`)

      clearTimeout(reconnectTimeout)
      reconnectTimeout = setTimeout(() => {
        connectToServer()
      }, 2000 * reconnectAttempts) // Backoff exponencial
    } else {
      console.error("Número máximo de tentativas de reconexão atingido")
      triggerEvent("error", { message: "Não foi possível reconectar ao servidor" })
    }
  }

  // Send message to server
  const send = (type, data) => {
    if (connectionStatus !== ConnectionStatus.CONNECTED || !socket) {
      console.error("Cannot send message: WebSocket not connected")
      return false
    }

    try {
      socket.emit(type, data)
      return true
    } catch (error) {
      console.error(`Error sending message: ${error}`)
      return false
    }
  }

  // Disconnect WebSocket
  const disconnect = () => {
    if (connectionStatus === ConnectionStatus.DISCONNECTED || !socket) {
      return
    }

    try {
      socket.disconnect()
    } catch (error) {
      console.error(`Error disconnecting: ${error}`)
    }

    // Reset state
    connectionStatus = ConnectionStatus.DISCONNECTED
    userId = null
    username = null
    currentTableId = null

    // Trigger event
    triggerEvent("disconnected")
    triggerEvent("connectionStatusChanged", connectionStatus)
  }

  // Add event listener
  const addEventListener = (event, callback) => {
    if (!eventListeners[event]) {
      eventListeners[event] = []
    }
    eventListeners[event].push(callback)
  }

  // Remove event listener
  const removeEventListener = (event, callback) => {
    if (!eventListeners[event]) return
    eventListeners[event] = eventListeners[event].filter((cb) => cb !== callback)
  }

  // Trigger event
  const triggerEvent = (event, data) => {
    if (!eventListeners[event]) return
    eventListeners[event].forEach((callback) => callback(data))
  }

  // Get connection status
  const getConnectionStatus = () => connectionStatus

  // Get current table ID
  const getCurrentTableId = () => currentTableId

  // Public API
  return {
    init,
    send,
    disconnect,
    addEventListener,
    removeEventListener,
    getConnectionStatus,
    getCurrentTableId,
    ConnectionStatus,
  }
})()

// Export for use in other modules
window.WebSocketClient = WebSocketClient

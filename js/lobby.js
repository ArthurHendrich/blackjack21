// Lobby functionality

document.addEventListener("DOMContentLoaded", () => {
  // Import necessary modules or declare variables
  const Auth = window.Auth // Assuming Auth is available globally or adjust import as needed
  const WebSocketClient = window.WebSocketClient // Assuming WebSocketClient is available globally or adjust import as needed

  // DOM elements
  const tablesGrid = document.getElementById("tables-grid")
  const onlinePlayersList = document.getElementById("online-players-list")
  const onlineCount = document.getElementById("online-count")
  const globalChatMessages = document.getElementById("global-chat-messages")
  const globalChatInput = document.getElementById("global-chat-input")
  const sendGlobalChat = document.getElementById("send-global-chat")
  const createTableBtn = document.getElementById("create-table-btn")
  const tableSearch = document.getElementById("table-search")
  const tableFilter = document.getElementById("table-filter")

  // Modals
  const createTableModal = document.getElementById("create-table-modal")
  const joinTableModal = document.getElementById("join-table-modal")
  const closeModals = document.querySelectorAll(".close-modal")

  // Forms
  const createTableForm = document.getElementById("create-table-form")
  const joinTableForm = document.getElementById("join-table-form")

  // Variables
  let tables = []
  let onlineUsers = []
  let selectedTableId = null
  const sharedTablesKey = "shared_blackjack_tables"
  const localTablesKey = "blackjack_tables"
  let lastServerTablesUpdate = 0 // Timestamp da última atualização de mesas do servidor
  let refreshInterval = null // Intervalo para atualização periódica

  // Initialize WebSocket connection
  const initWebSocket = () => {
    const user = Auth.getCurrentUser()
    if (user) {
      if (!window.WebSocketClient) {
        console.error(
          "WebSocketClient não está disponível. Verifique se o script websocket.js foi carregado corretamente.",
        )
        return
      }

      WebSocketClient.init({
        id: user.id,
        username: user.username,
      })

      // Set up event listeners
      WebSocketClient.addEventListener("connected", handleWebSocketConnected)
      WebSocketClient.addEventListener("disconnected", handleWebSocketDisconnected)
      WebSocketClient.addEventListener("onlineUsersUpdated", handleOnlineUsersUpdated)
      WebSocketClient.addEventListener("tablesUpdated", handleTablesUpdated)
      WebSocketClient.addEventListener("tableCreated", handleTableCreated)
      WebSocketClient.addEventListener("tableJoined", handleTableJoined)
      WebSocketClient.addEventListener("globalMessageReceived", handleGlobalMessageReceived)
      WebSocketClient.addEventListener("error", handleWebSocketError)
    }
  }

  // Handle WebSocket connected
  const handleWebSocketConnected = () => {
    console.log("WebSocket conectado ao servidor")

    // Load initial data
    loadTables()
    loadOnlineUsers()
    loadGlobalMessages()

    // Iniciar atualização periódica
    startPeriodicRefresh()
  }

  // Handle WebSocket disconnected
  const handleWebSocketDisconnected = () => {
    console.log("WebSocket disconnected")

    // Parar atualização periódica
    stopPeriodicRefresh()
  }

  // Iniciar atualização periódica
  const startPeriodicRefresh = () => {
    // Limpar intervalo existente, se houver
    stopPeriodicRefresh()

    // Definir novo intervalo - 5 segundos
    refreshInterval = setInterval(() => {
      // Request tables update from server if connected
      if (
        WebSocketClient &&
        WebSocketClient.getConnectionStatus &&
        WebSocketClient.getConnectionStatus() === WebSocketClient.ConnectionStatus.CONNECTED
      ) {
        WebSocketClient.send("getTables")
      }
    }, 5000) // 5 segundos
  }

  // Parar atualização periódica
  const stopPeriodicRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  // Handle online users updated
  const handleOnlineUsersUpdated = (users) => {
    console.log("Usuários online atualizados:", users)

    // Remover usuários duplicados (manter apenas a instância mais recente)
    const uniqueUsers = {}
    if (Array.isArray(users)) {
      users.forEach((user) => {
        // Se já existe um usuário com este ID, substituir apenas se for mais recente
        if (!uniqueUsers[user.id] || new Date(user.lastActive) > new Date(uniqueUsers[user.id].lastActive)) {
          uniqueUsers[user.id] = user
        }
      })

      // Converter de volta para array
      onlineUsers = Object.values(uniqueUsers)
      console.log("Usuários após remoção de duplicatas:", onlineUsers)
    } else {
      onlineUsers = []
    }

    renderOnlineUsers()
  }

  // Handle tables updated
  const handleTablesUpdated = (updatedTables) => {
    console.log("Mesas atualizadas recebidas do servidor:", updatedTables)
    lastServerTablesUpdate = Date.now()

    // Verificar se as mesas recebidas são válidas
    if (!Array.isArray(updatedTables)) {
      console.error("Formato inválido de mesas recebido do servidor")
      return
    }

    // Confiar na lista de mesas do servidor
    tables = [...updatedTables]

    // Armazenar as mesas em localStorage e sessionStorage
    localStorage.setItem(localTablesKey, JSON.stringify(tables))
    sessionStorage.setItem(sharedTablesKey, JSON.stringify(tables))

    console.log("Mesas atualizadas do servidor:", tables)
    renderTables()
  }

  // Handle table created
  const handleTableCreated = (table) => {
    closeModal(createTableModal)

    // Check if table already exists
    const existingTableIndex = tables.findIndex((t) => t.id === table.id)

    if (existingTableIndex >= 0) {
      // Update existing table
      tables[existingTableIndex] = table
    } else {
      // Add the new table to the tables array
      tables.push(table)
    }

    // Update both localStorage and sessionStorage
    localStorage.setItem(localTablesKey, JSON.stringify(tables))
    sessionStorage.setItem(sharedTablesKey, JSON.stringify(tables))

    // Render tables before redirecting
    renderTables()

    // Redirect to game page
    window.location.href = `game.html?table=${table.id}`
  }

  // Handle table joined
  const handleTableJoined = (table) => {
    closeModal(joinTableModal)
    window.location.href = `game.html?table=${table.id}`
  }

  // Handle global message received
  const handleGlobalMessageReceived = (message) => {
    addGlobalChatMessage(message)
  }

  // Handle WebSocket error
  const handleWebSocketError = (error) => {
    console.error("Erro WebSocket:", error)

    // Verificar se é um erro de mesa não encontrada
    if (error && error.message === "Mesa não encontrada") {
      alert("A mesa que você está tentando entrar não existe mais. A lista de mesas será atualizada.")

      // Solicitar atualização das mesas
      if (WebSocketClient && WebSocketClient.send) {
        WebSocketClient.send("getTables")
      }

      // Fechar o modal de entrada na mesa
      closeModal(joinTableModal)
    } else if (error && error.message) {
      alert(error.message)
    } else {
      alert("Ocorreu um erro na comunicação com o servidor.")
    }
  }

  // Load tables
  const loadTables = () => {
    // Try to get tables from different sources in order of freshness
    let loadedTables = []

    // 1. Try WebSocket if available
    if (
      WebSocketClient &&
      WebSocketClient.getConnectionStatus &&
      WebSocketClient.getConnectionStatus() === WebSocketClient.ConnectionStatus.CONNECTED
    ) {
      console.log("Loading tables from WebSocket")
      // Tables will be loaded via handleTablesUpdated
      WebSocketClient.send("getTables")
      return
    }

    // 2. Try sessionStorage (shared between tabs)
    const sharedTables = sessionStorage.getItem(sharedTablesKey)
    if (sharedTables) {
      try {
        loadedTables = JSON.parse(sharedTables)
        console.log("Tables loaded from sessionStorage:", loadedTables)
      } catch (e) {
        console.error("Error parsing tables from sessionStorage:", e)
      }
    }

    // 3. Fall back to localStorage if needed
    if (!loadedTables || loadedTables.length === 0) {
      const storedTables = localStorage.getItem(localTablesKey)
      if (storedTables) {
        try {
          loadedTables = JSON.parse(storedTables)
          console.log("Tables loaded from localStorage:", loadedTables)
        } catch (e) {
          console.error("Error parsing tables from localStorage:", e)
        }
      }
    }

    // Remove duplicate tables (same ID)
    const uniqueTables = {}
    loadedTables.forEach((table) => {
      uniqueTables[table.id] = table
    })

    tables = Object.values(uniqueTables)

    // Update both storage locations with deduplicated tables
    localStorage.setItem(localTablesKey, JSON.stringify(tables))
    sessionStorage.setItem(sharedTablesKey, JSON.stringify(tables))

    renderTables()
    console.log("Tables loaded:", tables)
  }

  // Load online users
  const loadOnlineUsers = () => {
    onlineUsers = JSON.parse(localStorage.getItem("blackjack_online_users") || "[]")
    renderOnlineUsers()
  }

  // Load global messages
  const loadGlobalMessages = () => {
    const messages = JSON.parse(localStorage.getItem("blackjack_global_messages") || "[]")
    globalChatMessages.innerHTML = ""
    messages.forEach(addGlobalChatMessage)
  }

  // Render tables
  const renderTables = () => {
    // Filter tables based on search and filter
    const searchTerm = tableSearch ? tableSearch.value.toLowerCase() : ""
    const filterValue = tableFilter ? tableFilter.value : "all"

    const filteredTables = tables.filter((table) => {
      // Search filter
      const matchesSearch =
        table.name.toLowerCase().includes(searchTerm) || table.host.username.toLowerCase().includes(searchTerm)

      // Level filter
      const matchesLevel = filterValue === "all" || table.level === filterValue

      // Available seats filter
      const hasAvailableSeats = filterValue !== "available" || table.players.length < table.maxPlayers

      return matchesSearch && matchesLevel && hasAvailableSeats
    })

    // Render tables
    if (!tablesGrid) {
      console.error("Tables grid element not found")
      return
    }

    tablesGrid.innerHTML = ""

    if (filteredTables.length === 0) {
      tablesGrid.innerHTML = `
        <div class="no-tables">
          <p>No tables found. Create a new one!</p>
        </div>
      `
      return
    }

    filteredTables.forEach((table) => {
      const tableCard = document.createElement("div")
      tableCard.className = "table-card"

      const levelClass =
        table.level === "beginner" ? "beginner" : table.level === "intermediate" ? "intermediate" : "expert"

      tableCard.innerHTML = `
        <div class="table-header">
          <div class="table-name">${table.name}</div>
          <div class="table-host">Host: ${table.host.username}</div>
          <div class="table-level ${levelClass}">${table.level.charAt(0).toUpperCase() + table.level.slice(1)}</div>
        </div>
        <div class="table-info">
          <div class="table-detail">
            <div class="table-detail-label">Status:</div>
            <div>${table.status === "waiting" ? "Waiting for players" : "Playing"}</div>
          </div>
          <div class="table-detail">
            <div class="table-detail-label">Players:</div>
            <div>${table.players.length}/${table.maxPlayers}</div>
          </div>
          <div class="table-detail">
            <div class="table-detail-label">Rounds:</div>
            <div>${table.rounds}</div>
          </div>
          <div class="table-detail">
            <div class="table-detail-label">Turn Timeout:</div>
            <div>${table.timeout} seconds</div>
          </div>
          <div class="table-players">
            ${renderTablePlayers(table)}
          </div>
        </div>
        <div class="table-actions">
          ${table.hasPassword ? '<span class="table-password-protected"><i class="fas fa-lock"></i> Password Protected</span>' : ""}
          <button class="btn btn-primary join-table-btn" data-table-id="${table.id}">Join Table</button>
        </div>
      `

      tablesGrid.appendChild(tableCard)

      // Add event listener to join button
      const joinBtn = tableCard.querySelector(".join-table-btn")
      if (joinBtn) {
        joinBtn.addEventListener("click", () => {
          openJoinTableModal(table)
        })
      }
    })
  }

  // Render table players
  const renderTablePlayers = (table) => {
    let html = ""

    // Add existing players
    for (let i = 0; i < table.players.length; i++) {
      html += `<div class="table-player" title="${table.players[i].username}">${table.players[i].username.charAt(0)}</div>`
    }

    // Add empty slots
    for (let i = table.players.length; i < table.maxPlayers; i++) {
      html += `<div class="table-player empty">+</div>`
    }

    return html
  }

  // Render online users
  const renderOnlineUsers = () => {
    if (!onlinePlayersList || !onlineCount) {
      console.error("Online players list or count element not found")
      return
    }

    onlinePlayersList.innerHTML = ""
    onlineCount.textContent = onlineUsers.length

    onlineUsers.forEach((user) => {
      const li = document.createElement("li")
      li.className = `online-player ${user.status !== "online" ? "playing" : ""}`

      li.innerHTML = `
        <img src="assets/avatars/avatar-1.png" alt="${user.username}" class="online-player-avatar">
        <span class="online-player-name">${user.username}</span>
        ${user.status !== "online" ? '<span class="online-player-status">(Playing)</span>' : ""}
      `

      onlinePlayersList.appendChild(li)
    })
  }

  // Add global chat message
  const addGlobalChatMessage = (message) => {
    if (!globalChatMessages) {
      console.error("Global chat messages element not found")
      return
    }

    const currentUser = Auth.getCurrentUser()
    const isOwnMessage = currentUser && message.senderId === currentUser.id

    const messageDiv = document.createElement("div")
    messageDiv.className = `chat-message ${isOwnMessage ? "own-message" : ""}`

    const timestamp = new Date(message.timestamp)
    const timeString = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    messageDiv.innerHTML = `
      <div class="chat-message-sender">${isOwnMessage ? "You" : message.senderName}</div>
      <div class="chat-message-content">${message.message}</div>
      <div class="chat-message-time">${timeString}</div>
    `

    globalChatMessages.appendChild(messageDiv)
    globalChatMessages.scrollTop = globalChatMessages.scrollHeight
  }

  // Open create table modal
  const openCreateTableModal = () => {
    if (!createTableModal) {
      console.error("Create table modal element not found")
      return
    }
    createTableModal.classList.add("active")
  }

  // Open join table modal
  const openJoinTableModal = (table) => {
    if (!joinTableModal) {
      console.error("Join table modal element not found")
      return
    }

    selectedTableId = table.id

    // Update modal content
    const joinTableName = document.getElementById("join-table-name")
    const joinTableHost = document.getElementById("join-table-host")
    const joinTablePlayers = document.getElementById("join-table-players")
    const joinTableLevel = document.getElementById("join-table-level")
    const passwordGroup = document.getElementById("password-group")

    if (joinTableName) joinTableName.textContent = table.name
    if (joinTableHost) joinTableHost.textContent = table.host.username
    if (joinTablePlayers) joinTablePlayers.textContent = `${table.players.length}/${table.maxPlayers}`
    if (joinTableLevel) joinTableLevel.textContent = table.level.charAt(0).toUpperCase() + table.level.slice(1)

    // Show/hide password field
    if (passwordGroup) {
      passwordGroup.style.display = table.hasPassword ? "block" : "none"
    }

    joinTableModal.classList.add("active")
  }

  // Close modal
  const closeModal = (modal) => {
    if (!modal) {
      console.error("Modal element not found")
      return
    }
    modal.classList.remove("active")
  }

  // Handle create table form submit
  const handleCreateTableSubmit = (e) => {
    e.preventDefault()

    const tableName = document.getElementById("table-name")?.value
    const maxPlayers = Number.parseInt(document.getElementById("max-players")?.value || "4")
    const numRounds = Number.parseInt(document.getElementById("num-rounds")?.value || "5")
    const turnTimeout = Number.parseInt(document.getElementById("turn-timeout")?.value || "30")
    const tableLevel = document.getElementById("table-level")?.value || "beginner"
    const tablePassword = document.getElementById("table-password")?.value || ""

    if (!tableName) {
      alert("Please enter a table name")
      return
    }

    const currentUser = Auth.getCurrentUser()
    if (!currentUser) {
      alert("You must be logged in to create a table")
      return
    }

    // Create table locally if WebSocketClient is not available
    if (!WebSocketClient || !WebSocketClient.send) {
      console.log("WebSocketClient not available, creating table locally")

      const newTable = {
        id: `table_${Date.now()}`,
        name: tableName,
        host: {
          id: currentUser.id,
          username: currentUser.username,
        },
        maxPlayers: maxPlayers,
        rounds: numRounds,
        timeout: turnTimeout,
        level: tableLevel,
        hasPassword: !!tablePassword,
        password: tablePassword,
        players: [
          {
            id: currentUser.id,
            username: currentUser.username,
            position: 0,
            status: "waiting",
          },
        ],
        status: "waiting",
        createdAt: new Date().toISOString(),
      }

      // Add to tables array
      tables.push(newTable)

      // Update both localStorage and sessionStorage
      localStorage.setItem(localTablesKey, JSON.stringify(tables))
      sessionStorage.setItem(sharedTablesKey, JSON.stringify(tables))

      // Close modal and redirect
      closeModal(createTableModal)
      window.location.href = `game.html?table=${newTable.id}`

      return
    }

    // Send create table request to server
    WebSocketClient.send("createTable", {
      name: tableName,
      maxPlayers: maxPlayers,
      rounds: numRounds,
      timeout: turnTimeout,
      level: tableLevel,
      password: tablePassword,
    })
  }

  // Handle join table form submit
  const handleJoinTableSubmit = (e) => {
    e.preventDefault()

    const password = document.getElementById("join-table-password")?.value || ""
    console.log("Tentando entrar na mesa ID:", selectedTableId)

    const currentUser = Auth.getCurrentUser()
    if (!currentUser) {
      alert("You must be logged in to join a table")
      return
    }

    // Verificar se a mesa ainda existe antes de tentar entrar
    const tableExists = tables.some((t) => t.id === selectedTableId)
    if (!tableExists) {
      console.error("A mesa selecionada não existe mais na lista local")
      alert("The table you're trying to join no longer exists. Please refresh the lobby.")
      closeModal(joinTableModal)
      return
    }

    // Join table locally if WebSocketClient is not available
    if (!WebSocketClient || !WebSocketClient.send) {
      console.log("WebSocketClient not available, joining table locally")

      const table = tables.find((t) => t.id === selectedTableId)

      if (!table) {
        alert("Table not found")
        return
      }

      // Check password if needed
      if (table.hasPassword && table.password !== password) {
        alert("Incorrect password")
        return
      }

      // Check if player is already in the table
      if (table.players.some((p) => p.id === currentUser.id)) {
        // Already in table, just redirect
        closeModal(joinTableModal)
        window.location.href = `game.html?table=${table.id}`
        return
      }

      // Check if table is full
      if (table.players.length >= table.maxPlayers) {
        alert("Table is full")
        return
      }

      // Add player to table
      table.players.push({
        id: currentUser.id,
        username: currentUser.username,
        position: table.players.length,
        status: "waiting",
      })

      // Update both localStorage and sessionStorage
      localStorage.setItem(localTablesKey, JSON.stringify(tables))
      sessionStorage.setItem(sharedTablesKey, JSON.stringify(tables))

      // Close modal and redirect
      closeModal(joinTableModal)
      window.location.href = `game.html?table=${table.id}`

      return
    }

    console.log("Enviando solicitação para entrar na mesa via WebSocket")
    // Send join table request to server
    WebSocketClient.send("joinTable", {
      tableId: selectedTableId,
      password: password,
    })
  }

  // Handle send global chat
  const handleSendGlobalChat = () => {
    if (!globalChatInput) {
      console.error("Global chat input element not found")
      return
    }

    const message = globalChatInput.value.trim()

    if (message) {
      const currentUser = Auth.getCurrentUser()

      if (!currentUser) {
        alert("You must be logged in to send messages")
        return
      }

      if (!WebSocketClient || !WebSocketClient.send) {
        // Handle locally if WebSocketClient is not available
        const chatMessage = {
          id: `msg_${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.username,
          message: message,
          timestamp: new Date().toISOString(),
        }

        // Add to messages
        const messages = JSON.parse(localStorage.getItem("blackjack_global_messages") || "[]")
        messages.push(chatMessage)
        localStorage.setItem("blackjack_global_messages", JSON.stringify(messages))

        // Display message
        addGlobalChatMessage(chatMessage)
      } else {
        WebSocketClient.send("globalMessage", { message })
      }

      globalChatInput.value = ""
    }
  }

  // Set up event listeners
  const setupEventListeners = () => {
    // Create table button
    if (createTableBtn) {
      createTableBtn.addEventListener("click", openCreateTableModal)
    }

    // Close modals
    closeModals.forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => {
        closeModal(closeBtn.closest(".modal"))
      })
    })

    // Create table form
    if (createTableForm) {
      createTableForm.addEventListener("submit", handleCreateTableSubmit)
    }

    // Join table form
    if (joinTableForm) {
      joinTableForm.addEventListener("submit", handleJoinTableSubmit)
    }

    // Send global chat
    if (sendGlobalChat) {
      sendGlobalChat.addEventListener("click", handleSendGlobalChat)
    }

    if (globalChatInput) {
      globalChatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          handleSendGlobalChat()
        }
      })
    }

    // Table search
    if (tableSearch) {
      tableSearch.addEventListener("input", renderTables)
    }

    // Table filter
    if (tableFilter) {
      tableFilter.addEventListener("change", renderTables)
    }

    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        closeModal(e.target)
      }
    })

    // Adicionar evento de logout para limpar dados
    const logoutBtn = document.getElementById("logout-btn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        // Limpar dados de mesas ao fazer logout
        localStorage.removeItem(localTablesKey)
        sessionStorage.removeItem(sharedTablesKey)
      })
    }
  }

  // Initialize
  const init = () => {
    setupEventListeners()
    initWebSocket()
  }

  // Start the app
  init()
})

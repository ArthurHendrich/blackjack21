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

  // Initialize WebSocket connection
  const initWebSocket = () => {
    const user = Auth.getCurrentUser()
    if (user) {
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
    console.log("WebSocket conectado ao servidor");

    // Load initial data
    loadTables();
    loadOnlineUsers();
    loadGlobalMessages();
  }

  // Handle WebSocket disconnected
  const handleWebSocketDisconnected = () => {
    console.log("WebSocket disconnected")
  }

  // Handle online users updated
  const handleOnlineUsersUpdated = (users) => {
    console.log("Usuários online atualizados:", users);
    onlineUsers = users;
    renderOnlineUsers();
  }

  // Handle tables updated
  const handleTablesUpdated = (updatedTables) => {
    console.log("Mesas atualizadas:", updatedTables);
    tables = updatedTables;
    localStorage.setItem("blackjack_tables", JSON.stringify(updatedTables));
    renderTables();
  }

  // Handle table created
  const handleTableCreated = (table) => {
    closeModal(createTableModal)
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
    alert(error.message)
  }

  // Load tables
  const loadTables = () => {
    const storedTables = JSON.parse(localStorage.getItem("blackjack_tables") || "[]");
    tables = storedTables;
    renderTables();
    console.log("Mesas carregadas do localStorage:", tables);
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
    const searchTerm = tableSearch.value.toLowerCase()
    const filterValue = tableFilter.value

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
      joinBtn.addEventListener("click", () => {
        openJoinTableModal(table)
      })
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
    onlinePlayersList.innerHTML = ""
    onlineCount.textContent = onlineUsers.length

    onlineUsers.forEach((user) => {
      const li = document.createElement("li")
      li.className = `online-player ${user.status !== "online" ? "playing" : ""}`

      li.innerHTML = `
        <img src="assets/avatar-placeholder.png" alt="${user.username}" class="online-player-avatar">
        <span class="online-player-name">${user.username}</span>
        ${user.status !== "online" ? '<span class="online-player-status">(Playing)</span>' : ""}
      `

      onlinePlayersList.appendChild(li)
    })
  }

  // Add global chat message
  const addGlobalChatMessage = (message) => {
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
    createTableModal.classList.add("active")
  }

  // Open join table modal
  const openJoinTableModal = (table) => {
    selectedTableId = table.id

    // Update modal content
    document.getElementById("join-table-name").textContent = table.name
    document.getElementById("join-table-host").textContent = table.host.username
    document.getElementById("join-table-players").textContent = `${table.players.length}/${table.maxPlayers}`
    document.getElementById("join-table-level").textContent = table.level.charAt(0).toUpperCase() + table.level.slice(1)

    // Show/hide password field
    const passwordGroup = document.getElementById("password-group")
    passwordGroup.style.display = table.hasPassword ? "block" : "none"

    joinTableModal.classList.add("active")
  }

  // Close modal
  const closeModal = (modal) => {
    modal.classList.remove("active")
  }

  // Handle create table form submit
  const handleCreateTableSubmit = (e) => {
    e.preventDefault()

    const tableName = document.getElementById("table-name").value
    const maxPlayers = Number.parseInt(document.getElementById("max-players").value)
    const numRounds = Number.parseInt(document.getElementById("num-rounds").value)
    const turnTimeout = Number.parseInt(document.getElementById("turn-timeout").value)
    const tableLevel = document.getElementById("table-level").value
    const tablePassword = document.getElementById("table-password").value

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

    const password = document.getElementById("join-table-password").value

    WebSocketClient.send("joinTable", {
      tableId: selectedTableId,
      password: password,
    })
  }

  // Handle send global chat
  const handleSendGlobalChat = () => {
    const message = globalChatInput.value.trim()

    if (message) {
      WebSocketClient.send("globalMessage", { message })
      globalChatInput.value = ""
    }
  }

  // Set up event listeners
  const setupEventListeners = () => {
    // Create table button
    createTableBtn.addEventListener("click", openCreateTableModal)

    // Close modals
    closeModals.forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => {
        closeModal(closeBtn.closest(".modal"))
      })
    })

    // Create table form
    createTableForm.addEventListener("submit", handleCreateTableSubmit)

    // Join table form
    joinTableForm.addEventListener("submit", handleJoinTableSubmit)

    // Send global chat
    sendGlobalChat.addEventListener("click", handleSendGlobalChat)
    globalChatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSendGlobalChat()
      }
    })

    // Table search
    tableSearch.addEventListener("input", renderTables)

    // Table filter
    tableFilter.addEventListener("change", renderTables)

    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        closeModal(e.target)
      }
    })
  }

  // Initialize
  const init = () => {
    setupEventListeners()
    initWebSocket()
  }

  // Start the app
  init()
})

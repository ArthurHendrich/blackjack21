// Enhanced game logic with animations and multiplayer support

// Import necessary modules
const CardSprites = window.CardSprites || {}
const UI = window.UI || {}
const Cards = window.Cards || {}
const Animations = window.Animations || {}

const Game = {
  // Game state
  state: {
    tableId: null,
    tableName: "",
    currentRound: 1,
    totalRounds: 5,
    currentPlayerIndex: 0,
    deck: [],
    dealer: {
      hand: [],
      score: 0,
    },
    players: [],
    status: "waiting",
    timer: null,
    timeLeft: 30,
    isHost: false,
    animationsEnabled: true,
  },

  // Initialize game
  init: function (playerNames, rounds, timeout) {
    // Create and shuffle deck
    this.state.deck = CardSprites.shuffleDeck(CardSprites.createDeck())
    this.state.totalRounds = rounds || 5
    this.state.currentRound = 1

    // Initialize players
    this.state.players = playerNames.map((name, index) => ({
      id: `player_${index}`,
      name,
      hand: [],
      score: 0,
      stood: false,
      position: index,
    }))

    // Initialize dealer
    this.state.dealer = {
      hand: [],
      score: 0,
    }

    // Deal initial cards
    this.dealInitialCards()

    // Update UI
    UI.updateGameInfo(this.state.currentRound, this.state.totalRounds)
    UI.renderDealerCards(this.state.dealer.hand, true)
    UI.renderPlayers(this.state.players, 0)
    UI.updateControls(true, true)

    // Start timer if specified
    if (timeout) {
      this.startTimer(timeout)
    }
  },

  // Deal initial cards
  dealInitialCards: function () {
    // Deal first card to each player
    this.state.players.forEach((player) => {
      player.hand.push(this.drawCard())
    })

    // Deal first card to dealer
    this.state.dealer.hand.push(this.drawCard())

    // Deal second card to each player
    this.state.players.forEach((player) => {
      player.hand.push(this.drawCard())
    })

    // Deal second card to dealer
    this.state.dealer.hand.push(this.drawCard())
  },

  // Draw a card from the deck
  drawCard: function () {
    return this.state.deck.pop()
  },

  // Player hits
  hit: function () {
    const currentPlayer = this.state.players[this.state.currentPlayerIndex]

    // Add card to player's hand
    currentPlayer.hand.push(this.drawCard())

    // Check if player busts
    if (Cards.isBusted(currentPlayer.hand)) {
      currentPlayer.stood = true
      this.nextTurn()
    }

    // Update UI
    UI.renderPlayers(this.state.players, this.state.currentPlayerIndex)
  },

  // Player stands
  stand: function () {
    const currentPlayer = this.state.players[this.state.currentPlayerIndex]
    currentPlayer.stood = true

    this.nextTurn()
  },

  // Move to next turn
  nextTurn: function () {
    // Find next player who hasn't stood yet
    let nextPlayerIndex = this.state.currentPlayerIndex + 1

    while (nextPlayerIndex < this.state.players.length && this.state.players[nextPlayerIndex].stood) {
      nextPlayerIndex++
    }

    // If all players have played, it's dealer's turn
    if (nextPlayerIndex >= this.state.players.length) {
      this.dealerPlay()
    } else {
      this.state.currentPlayerIndex = nextPlayerIndex
      UI.renderPlayers(this.state.players, this.state.currentPlayerIndex)
      UI.updateControls(true, true)
    }
  },

  // Dealer plays
  dealerPlay: function () {
    // Show dealer's hidden card with animation
    this.revealDealerCard(() => {
      // After card is revealed, dealer draws until 17 or higher
      this.dealerDrawCards()
    })
  },

  // Reveal dealer's hidden card with animation
  revealDealerCard: function (callback) {
    // Get dealer card elements
    const dealerCardsElement = document.getElementById("dealer-cards")
    if (!dealerCardsElement) {
      // If element not found, just proceed without animation
      UI.renderDealerCards(this.state.dealer.hand, false)
      if (callback) callback()
      return
    }

    // Get the first card (hidden card)
    const hiddenCardElement = dealerCardsElement.querySelector(".card.face-down")
    if (!hiddenCardElement) {
      // If no hidden card, just proceed
      UI.renderDealerCards(this.state.dealer.hand, false)
      if (callback) callback()
      return
    }

    // Create animation effect
    if (this.state.animationsEnabled && window.Animations) {
      // Add flip animation class
      hiddenCardElement.classList.add("flipping")

      // Play flip sound if available
      if (window.playSound) {
        window.playSound("card-flip")
      }

      // Animate the card flip
      setTimeout(() => {
        // Replace the hidden card with the actual card
        UI.renderDealerCards(this.state.dealer.hand, false)

        // Call the callback after animation completes
        setTimeout(() => {
          if (callback) callback()
        }, 500)
      }, 500)
    } else {
      // No animations, just update UI
      UI.renderDealerCards(this.state.dealer.hand, false)
      if (callback) callback()
    }
  },

  // Dealer draws cards until 17 or higher
  dealerDrawCards: function () {
    const drawNextCard = () => {
      // Calculate current hand value
      const handValue = Cards.calculateHandValue(this.state.dealer.hand)

      // If dealer has less than 17, draw another card
      if (handValue < 17) {
        // Draw a card
        const newCard = this.drawCard()
        this.state.dealer.hand.push(newCard)

        // Update UI
        UI.renderDealerCards(this.state.dealer.hand, false)

        // Play card sound if available
        if (window.playSound) {
          window.playSound("card-deal")
        }

        // Wait a moment before drawing the next card
        setTimeout(() => {
          drawNextCard()
        }, 1000)
      } else {
        // Dealer is done drawing, end the round
        this.endRound()
      }
    }

    // Start drawing cards
    drawNextCard()
  },

  // End the round
  endRound: function () {
    const dealerScore = Cards.calculateHandValue(this.state.dealer.hand)
    const dealerBusted = Cards.isBusted(this.state.dealer.hand)

    // Calculate scores
    this.state.players.forEach((player) => {
      const playerScore = Cards.calculateHandValue(player.hand)
      const playerBusted = Cards.isBusted(player.hand)

      if (playerBusted) {
        // Player busts, no points
      } else if (dealerBusted || playerScore > dealerScore) {
        // Player wins
        player.score++
      } else if (playerScore === dealerScore) {
        // Push (tie)
        player.score += 0.5
      }
    })

    // Update scoreboard
    UI.updateScoreboard(this.state.players, {
      score: dealerBusted ? 0 : 1,
    })

    // Show round results with a delay
    setTimeout(() => {
      // Check if game is over
      if (this.state.currentRound >= this.state.totalRounds) {
        this.endGame()
      } else {
        // Show round results
        this.showRoundResults()
      }
    }, 1500)
  },

  // Show round results
  showRoundResults: function () {
    // Get elements
    const roundResultsModal = document.getElementById("round-results-modal")
    const resultDealerCards = document.getElementById("result-dealer-cards")
    const resultDealerScore = document.getElementById("result-dealer-score")
    const playersResults = document.getElementById("players-results")
    const roundSummary = document.getElementById("round-summary")

    if (!roundResultsModal || !resultDealerCards || !resultDealerScore || !playersResults || !roundSummary) {
      // If elements not found, just prepare for next round
      this.prepareNextRound()
      return
    }

    // Clear previous results
    resultDealerCards.innerHTML = ""
    playersResults.innerHTML = ""

    // Show dealer's cards and score
    const dealerValue = Cards.calculateHandValue(this.state.dealer.hand)
    const dealerBusted = Cards.isBusted(this.state.dealer.hand)

    this.state.dealer.hand.forEach((card) => {
      const cardElement = document.createElement("div")
      cardElement.className = "card small"

      const img = document.createElement("img")
      img.src = card.imagePath
      img.alt = `${card.value} of ${card.suit}`
      cardElement.appendChild(img)

      resultDealerCards.appendChild(cardElement)
    })

    resultDealerScore.textContent = `Score: ${dealerValue}${dealerBusted ? " (Busted)" : ""}`

    // Show players' results
    this.state.players.forEach((player) => {
      const playerResult = document.createElement("div")
      playerResult.className = "player-result"

      const playerValue = Cards.calculateHandValue(player.hand)
      const playerBusted = Cards.isBusted(player.hand)

      let resultStatus = ""
      if (playerBusted) {
        resultStatus = "Bust!"
      } else if (dealerBusted) {
        resultStatus = "Winner! +1 point"
      } else if (playerValue > dealerValue) {
        resultStatus = "Winner! +1 point"
      } else if (playerValue === dealerValue) {
        resultStatus = "Push (Tie) +0.5 point"
      } else {
        resultStatus = "Lost"
      }

      playerResult.innerHTML = `
        <h3>${player.name}</h3>
        <div class="result-cards" id="result-player-${player.id}-cards"></div>
        <div class="result-score">Score: ${playerValue}${playerBusted ? " (Busted)" : ""}</div>
        <div class="result-status ${playerBusted ? "loser" : (dealerBusted || playerValue > dealerValue) ? "winner" : playerValue === dealerValue ? "tie" : "loser"}">
          ${resultStatus}
        </div>
      `

      playersResults.appendChild(playerResult)

      // Show player's cards
      const playerCardsContainer = playerResult.querySelector(`#result-player-${player.id}-cards`)
      if (playerCardsContainer) {
        player.hand.forEach((card) => {
          const cardElement = document.createElement("div")
          cardElement.className = "card small"

          const img = document.createElement("img")
          img.src = card.imagePath
          img.alt = `${card.value} of ${card.suit}`
          cardElement.appendChild(img)

          playerCardsContainer.appendChild(cardElement)
        })
      }
    })

    // Show round summary
    const winners = this.state.players.filter((p) => {
      const playerValue = Cards.calculateHandValue(p.hand)
      const playerBusted = Cards.isBusted(p.hand)
      return !playerBusted && (dealerBusted || playerValue > dealerValue)
    })

    if (winners.length > 0) {
      roundSummary.innerHTML = `
        <h3>Round ${this.state.currentRound} Summary</h3>
        <p>${winners.map((p) => p.name).join(", ")} won this round!</p>
      `
    } else if (
      this.state.players.some((p) => {
        const playerValue = Cards.calculateHandValue(p.hand)
        return !Cards.isBusted(p.hand) && playerValue === dealerValue
      })
    ) {
      roundSummary.innerHTML = `
        <h3>Round ${this.state.currentRound} Summary</h3>
        <p>This round ended in a tie!</p>
      `
    } else {
      roundSummary.innerHTML = `
        <h3>Round ${this.state.currentRound} Summary</h3>
        <p>Dealer wins this round!</p>
      `
    }

    // Show modal
    roundResultsModal.classList.add("active")

    // Set up next round button
    const nextRoundBtn = document.getElementById("next-round-btn")
    if (nextRoundBtn) {
      nextRoundBtn.onclick = () => {
        roundResultsModal.classList.remove("active")
        this.prepareNextRound()
      }
    }
  },

  // Prepare for next round
  prepareNextRound: function () {
    this.state.currentRound++
    this.state.currentPlayerIndex = 0

    // Reset deck if needed
    if (this.state.deck.length < 20) {
      this.state.deck = CardSprites.shuffleDeck(CardSprites.createDeck())
    }

    // Reset hands
    this.state.dealer.hand = []
    this.state.players.forEach((player) => {
      player.hand = []
      player.stood = false
    })

    // Deal new cards
    this.dealInitialCards()

    // Update UI
    UI.updateGameInfo(this.state.currentRound, this.state.totalRounds)
    UI.renderDealerCards(this.state.dealer.hand, true)
    UI.renderPlayers(this.state.players, 0)
    UI.updateControls(true, true)
  },

  // End the game
  endGame: function () {
    // Find winner
    let winner = null
    let maxScore = -1

    this.state.players.forEach((player) => {
      if (player.score > maxScore) {
        maxScore = player.score
        winner = player
      }
    })

    // Show results
    UI.showResults(this.state.players, {
      score: Cards.isBusted(this.state.dealer.hand) ? 0 : 1,
    })
    UI.showScreen("results-screen")
  },

  // Start timer
  startTimer: function (seconds) {
    let timeLeft = seconds

    UI.updateTimer(timeLeft)

    const timer = setInterval(() => {
      timeLeft--
      UI.updateTimer(timeLeft)

      if (timeLeft <= 0) {
        clearInterval(timer)
        this.stand() // Auto-stand when time runs out
      }
    }, 1000)
  },
}

// Make Game available globally
window.Game = Game

document.addEventListener("DOMContentLoaded", () => {
  // Import necessary modules
  const Auth = window.Auth
  const WebSocketClient = window.WebSocketClient
  const Cards = window.Cards
  const UI = window.UI

  // DOM elements
  const tableName = document.getElementById("table-name")
  const currentRound = document.getElementById("current-round")
  const totalRounds = document.getElementById("total-rounds")
  const dealerCards = document.getElementById("dealer-cards")
  const dealerScore = document.getElementById("dealer-score")
  const playersContainer = document.getElementById("players-container")
  const gameMessage = document.getElementById("game-message")
  const timerBar = document.getElementById("timer-bar")
  const timerText = document.getElementById("timer-text")
  const hitBtn = document.getElementById("hit-btn")
  const standBtn = document.getElementById("stand-btn")
  const leaveTableBtn = document.getElementById("leave-table-btn")
  const scoreTable = document.getElementById("score-body")
  const tableChatMessages = document.getElementById("table-chat-messages")
  const tableChatInput = document.getElementById("table-chat-input")
  const sendTableChat = document.getElementById("send-table-chat")

  // Modals
  const waitingModal = document.getElementById("waiting-modal")
  const waitingPlayerCount = document.getElementById("waiting-player-count")
  const waitingMaxPlayers = document.getElementById("waiting-max-players")
  const waitingPlayers = document.getElementById("waiting-players")
  const startGameBtn = document.getElementById("start-game-btn")
  const cancelGameBtn = document.getElementById("cancel-game-btn")
  const roundResultsModal = document.getElementById("round-results-modal")
  const resultDealerCards = document.getElementById("result-dealer-cards")
  const resultDealerScore = document.getElementById("result-dealer-score")
  const playersResults = document.getElementById("players-results")
  const roundSummary = document.getElementById("round-summary")
  const nextRoundBtn = document.getElementById("next-round-btn")
  const gameOverModal = document.getElementById("game-over-modal")
  const finalScores = document.getElementById("final-scores")
  const winnerAnnouncement = document.getElementById("winner-announcement")
  const playAgainBtn = document.getElementById("play-again-btn")
  const returnLobbyBtn = document.getElementById("return-lobby-btn")

  // Game state
  let currentTable = null
  let currentGame = null
  let currentUser = null
  let isHost = false
  const timer = null
  let timerDuration = 30 // Default timer duration in seconds
  const timerRemaining = 0
  const playerCards = {}
  const playerScores = {}
  const playerStatuses = {}
  const roundResults = []
  const gameOver = false

  // Initialize game
  const init = () => {
    console.log("Initializing game...")

    // Get current user
    currentUser = Auth.getCurrentUser()
    if (!currentUser) {
      console.error("No user logged in")
      window.location.href = "index.html"
      return
    }

    // Get table ID from URL
    const urlParams = new URLSearchParams(window.location.search)
    const tableId = urlParams.get("table")

    if (!tableId) {
      console.error("No table ID provided")
      window.location.href = "lobby.html"
      return
    }

    console.log(`Loading table data for ID: ${tableId}`)

    // Load table data
    loadTableData(tableId)

    // Set up event listeners
    setupEventListeners()

    // Initialize WebSocket connection
    initWebSocket()
  }

  // Load table data
  const loadTableData = (tableId) => {
    // Try to get table data from localStorage or sessionStorage
    const tablesStr = sessionStorage.getItem("shared_blackjack_tables") || localStorage.getItem("blackjack_tables")

    if (!tablesStr) {
      console.error("No tables found in storage")
      return
    }

    try {
      const tables = JSON.parse(tablesStr)
      currentTable = tables.find((table) => table.id === tableId)

      if (!currentTable) {
        console.error(`Table with ID ${tableId} not found`)
        return
      }

      console.log("Table data loaded:", currentTable)

      // Check if current user is the host
      isHost = currentTable.host.id === currentUser.id
      console.log(`Current user is host: ${isHost}`)

      // Update UI with table data
      updateTableInfo()

      // Show waiting modal if game hasn't started
      if (currentTable.status === "waiting") {
        showWaitingModal()
      }
    } catch (error) {
      console.error("Error loading table data:", error)
    }
  }

  // Update table information in UI
  const updateTableInfo = () => {
    if (!currentTable) return

    // Update table name
    if (tableName) tableName.textContent = currentTable.name

    // Update rounds info
    if (totalRounds) totalRounds.textContent = currentTable.rounds.toString()
    if (currentRound) currentRound.textContent = "1"

    // Update timer duration
    timerDuration = currentTable.timeout || 30
  }

  // Show waiting modal
  const showWaitingModal = () => {
    if (!waitingModal || !currentTable) return

    // Update player count
    if (waitingPlayerCount) waitingPlayerCount.textContent = currentTable.players.length.toString()
    if (waitingMaxPlayers) waitingMaxPlayers.textContent = currentTable.maxPlayers.toString()

    // Show/hide start game button based on host status
    if (startGameBtn) {
      if (isHost) {
        startGameBtn.style.display = "block"
        // Enable start button only if there are at least 2 players
        startGameBtn.disabled = currentTable.players.length < 2
      } else {
        startGameBtn.style.display = "none"
      }
    }

    // Update waiting players list
    updateWaitingPlayers()

    // Show modal
    waitingModal.classList.add("active")
  }

  // Update waiting players list
  const updateWaitingPlayers = () => {
    if (!waitingPlayers || !currentTable) return

    waitingPlayers.innerHTML = ""

    currentTable.players.forEach((player) => {
      const playerDiv = document.createElement("div")
      playerDiv.className = "waiting-player"
      playerDiv.dataset.playerId = player.id

      const isCurrentUser = player.id === currentUser.id

      playerDiv.innerHTML = `
        <div class="player-avatar">
          <img src="assets/avatars/avatar-1.png" alt="${player.username}">
        </div>
        <div class="player-name">${isCurrentUser ? "You" : player.username}</div>
        ${player.id === currentTable.host.id ? '<div class="player-host">Host</div>' : ""}
      `

      waitingPlayers.appendChild(playerDiv)
    })

    // Update start button state if host
    if (isHost && startGameBtn) {
      startGameBtn.disabled = currentTable.players.length < 2
    }

    // Log the current players for debugging
    console.log("Current players in waiting room:", currentTable.players)
  }

  // Initialize WebSocket connection
  const initWebSocket = () => {
    if (!WebSocketClient) {
      console.error("WebSocketClient not available")
      return
    }

    // Initialize WebSocket with current user
    WebSocketClient.init({
      id: currentUser.id,
      username: currentUser.username,
    })

    // Set up WebSocket event listeners
    WebSocketClient.addEventListener("connected", handleWebSocketConnected)
    WebSocketClient.addEventListener("tablesUpdated", handleTablesUpdated)
    WebSocketClient.addEventListener("playerJoined", handlePlayerJoined)
    WebSocketClient.addEventListener("playerLeft", handlePlayerLeft)
    WebSocketClient.addEventListener("gameStarted", handleGameStarted)
    WebSocketClient.addEventListener("gameActionReceived", handleGameActionReceived)
    WebSocketClient.addEventListener("tableMessageReceived", handleTableMessageReceived)
    WebSocketClient.addEventListener("error", handleWebSocketError)
  }

  // Handle WebSocket connected
  const handleWebSocketConnected = () => {
    console.log("WebSocket connected")

    // Request latest table data
    if (currentTable) {
      WebSocketClient.send("getTables")
    }
  }

  // Handle tables updated
  const handleTablesUpdated = (tables) => {
    console.log("Tables updated:", tables)

    if (!currentTable || !tables) return

    // Find current table in updated tables
    const updatedTable = tables.find((table) => table.id === currentTable.id)

    if (!updatedTable) {
      console.error("Current table not found in updated tables")
      return
    }

    // Check if players have changed
    const oldPlayerIds = currentTable.players.map((p) => p.id)
    const newPlayerIds = updatedTable.players.map((p) => p.id)

    // Log player changes for debugging
    console.log("Previous players:", oldPlayerIds)
    console.log("New players:", newPlayerIds)

    // Update current table
    currentTable = updatedTable

    // Update UI
    updateTableInfo()

    // Update waiting players if in waiting mode
    if (currentTable.status === "waiting" && waitingModal.classList.contains("active")) {
      updateWaitingPlayers()
    }

    // Store updated table in localStorage and sessionStorage
    const tablesStr = localStorage.getItem("blackjack_tables")
    if (tablesStr) {
      try {
        const tables = JSON.parse(tablesStr)
        const tableIndex = tables.findIndex((t) => t.id === currentTable.id)
        if (tableIndex !== -1) {
          tables[tableIndex] = currentTable
          localStorage.setItem("blackjack_tables", JSON.stringify(tables))
          sessionStorage.setItem("shared_blackjack_tables", JSON.stringify(tables))
        }
      } catch (error) {
        console.error("Error updating table in storage:", error)
      }
    }
  }

  // Handle player joined
  const handlePlayerJoined = (data) => {
    console.log("Player joined event received:", data)

    if (!data || !data.tableId || !data.player) {
      console.error("Invalid player joined data")
      return
    }

    // Check if this is for our table
    if (data.tableId !== currentTable.id) {
      console.log("Player joined a different table")
      return
    }

    console.log(`Player ${data.player.username} joined our table`)

    // Request latest table data to ensure we have the most up-to-date player list
    WebSocketClient.send("getTables")

    // Add temporary visual indicator
    const playerExists = currentTable.players.some((p) => p.id === data.player.id)

    if (!playerExists && waitingPlayers) {
      // Add temporary player entry until the table update arrives
      const tempPlayerDiv = document.createElement("div")
      tempPlayerDiv.className = "waiting-player new-player"
      tempPlayerDiv.dataset.playerId = data.player.id
      tempPlayerDiv.dataset.temporary = "true"

      tempPlayerDiv.innerHTML = `
        <div class="player-avatar">
          <img src="assets/avatars/avatar-1.png" alt="${data.player.username}">
        </div>
        <div class="player-name">${data.player.username}</div>
        <div class="player-status">Joining...</div>
      `

      waitingPlayers.appendChild(tempPlayerDiv)

      // Highlight the new player
      setTimeout(() => {
        tempPlayerDiv.classList.add("highlight")
      }, 100)
    }

    // Update start button state if host
    if (isHost && startGameBtn) {
      // Count current players plus the new one if not already counted
      const playerCount = playerExists ? currentTable.players.length : currentTable.players.length + 1
      startGameBtn.disabled = playerCount < 2
    }
  }

  // Handle player left
  const handlePlayerLeft = (data) => {
    console.log("Player left:", data)

    if (!data || !data.tableId || !data.playerId) return

    // Check if this is for our table
    if (data.tableId !== currentTable.id) return

    // Request latest table data
    WebSocketClient.send("getTables")
  }

  // Handle game started
  const handleGameStarted = (gameData) => {
    console.log("Game started:", gameData)

    if (!gameData || gameData.tableId !== currentTable.id) return

    // Update game state
    currentGame = gameData

    // Hide waiting modal
    if (waitingModal) {
      waitingModal.classList.remove("active")
    }

    // Initialize game UI
    initGameUI()
  }

  // Handle game action received
  const handleGameActionReceived = (data) => {
    console.log("Game action received:", data)

    // Handle game actions here
  }

  // Handle table message received
  const handleTableMessageReceived = (message) => {
    console.log("Table message received:", message)

    if (!message) return

    addTableChatMessage(message)
  }

  // Handle WebSocket error
  const handleWebSocketError = (error) => {
    console.error("WebSocket error:", error)

    if (error && error.message) {
      alert(`Error: ${error.message}`)
    }
  }

  // Initialize game UI
  const initGameUI = () => {
    // Initialize game UI here
  }

  // Add table chat message
  const addTableChatMessage = (message) => {
    if (!tableChatMessages) return

    const isOwnMessage = message.senderId === currentUser.id

    const messageDiv = document.createElement("div")
    messageDiv.className = `chat-message ${isOwnMessage ? "own-message" : ""}`

    const timestamp = new Date(message.timestamp)
    const timeString = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    messageDiv.innerHTML = `
      <div class="chat-message-sender">${isOwnMessage ? "You" : message.senderName}</div>
      <div class="chat-message-content">${message.message}</div>
      <div class="chat-message-time">${timeString}</div>
    `

    tableChatMessages.appendChild(messageDiv)
    tableChatMessages.scrollTop = tableChatMessages.scrollHeight
  }

  // Set up event listeners
  const setupEventListeners = () => {
    // Leave table button
    if (leaveTableBtn) {
      leaveTableBtn.addEventListener("click", handleLeaveTable)
    }

    // Start game button
    if (startGameBtn) {
      startGameBtn.addEventListener("click", handleStartGame)
    }

    // Cancel game button
    if (cancelGameBtn) {
      cancelGameBtn.addEventListener("click", handleLeaveTable)
    }

    // Game action buttons
    if (hitBtn) {
      hitBtn.addEventListener("click", () => handleGameAction("hit"))
    }

    if (standBtn) {
      standBtn.addEventListener("click", () => handleGameAction("stand"))
    }

    // Chat
    if (sendTableChat) {
      sendTableChat.addEventListener("click", handleSendTableChat)
    }

    if (tableChatInput) {
      tableChatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          handleSendTableChat()
        }
      })
    }

    // Next round button
    if (nextRoundBtn) {
      nextRoundBtn.addEventListener("click", handleNextRound)
    }

    // Play again button
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", handlePlayAgain)
    }

    // Return to lobby button
    if (returnLobbyBtn) {
      returnLobbyBtn.addEventListener("click", handleReturnToLobby)
    }
  }

  // Handle leave table
  const handleLeaveTable = () => {
    if (WebSocketClient) {
      WebSocketClient.send("leaveTable")
    }

    window.location.href = "lobby.html"
  }

  // Handle start game
  const handleStartGame = () => {
    if (!isHost) {
      alert("Only the host can start the game")
      return
    }

    if (currentTable.players.length < 2) {
      alert("Need at least 2 players to start the game")
      return
    }

    if (WebSocketClient) {
      WebSocketClient.send("startGame", { tableId: currentTable.id })
    }
  }

  // Handle game action
  const handleGameAction = (action) => {
    if (!currentGame) return

    if (WebSocketClient) {
      WebSocketClient.send("gameAction", {
        tableId: currentTable.id,
        action: action,
      })
    }
  }

  // Handle send table chat
  const handleSendTableChat = () => {
    if (!tableChatInput || !currentTable) return

    const message = tableChatInput.value.trim()

    if (message && WebSocketClient) {
      WebSocketClient.send("tableMessage", {
        tableId: currentTable.id,
        message: message,
      })

      tableChatInput.value = ""
    }
  }

  // Handle next round
  const handleNextRound = () => {
    // Handle next round logic
  }

  // Handle play again
  const handlePlayAgain = () => {
    // Handle play again logic
  }

  // Handle return to lobby
  const handleReturnToLobby = () => {
    window.location.href = "lobby.html"
  }

  // Start the game
  init()
})

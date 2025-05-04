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
  const Auth = window.Auth || {}
  const WebSocketClient = window.WebSocketClient || {}
  const Animations = window.Animations || {}

  // DOM elements
  const tableName = document.getElementById("table-name")
  const currentRound = document.getElementById("current-round")
  const totalRounds = document.getElementById("total-rounds")
  const dealerCards = document.getElementById("dealer-cards")
  const dealerScore = document.getElementById("dealer-score")
  const playersContainer = document.getElementById("players-container")
  const deck = document.getElementById("deck")
  const gameMessage = document.getElementById("game-message")
  const timerBar = document.getElementById("timer-bar")
  const timerText = document.getElementById("timer-text")
  const hitBtn = document.getElementById("hit-btn")
  const standBtn = document.getElementById("stand-btn")
  const scoreBody = document.getElementById("score-body")
  const tableChatMessages = document.getElementById("table-chat-messages")
  const tableChatInput = document.getElementById("table-chat-input")
  const sendTableChat = document.getElementById("send-table-chat")
  const leaveTableBtn = document.getElementById("leave-table-btn")

  // Modals
  const roundResultsModal = document.getElementById("round-results-modal")
  const gameOverModal = document.getElementById("game-over-modal")
  const waitingModal = document.getElementById("waiting-modal")
  const nextRoundBtn = document.getElementById("next-round-btn")
  const playAgainBtn = document.getElementById("play-again-btn")
  const returnLobbyBtn = document.getElementById("return-lobby-btn")
  const startGameBtn = document.getElementById("start-game-btn")
  const cancelGameBtn = document.getElementById("cancel-game-btn")

  // Game state
  let gameState = {
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
  }

  // Current user
  const currentUser = Auth.getCurrentUser ? Auth.getCurrentUser() : { id: "guest", username: "Guest" }

  // Initialize game
  const initGame = () => {
    // Get table ID from URL
    const urlParams = new URLSearchParams(window.location.search)
    const tableId = urlParams.get("table")

    if (!tableId) {
      window.location.href = "lobby.html"
      return
    }

    // Initialize WebSocket if available
    if (WebSocketClient && WebSocketClient.init && currentUser) {
      WebSocketClient.init({
        id: currentUser.id,
        username: currentUser.username,
      })

      // Set up event listeners
      if (WebSocketClient.addEventListener) {
        WebSocketClient.addEventListener("connected", () => handleWebSocketConnected(tableId))
        WebSocketClient.addEventListener("disconnected", handleWebSocketDisconnected)
        WebSocketClient.addEventListener("gameStarted", handleGameStarted)
        WebSocketClient.addEventListener("gameActionReceived", handleGameActionReceived)
        WebSocketClient.addEventListener("tableMessageReceived", handleTableMessageReceived)
        WebSocketClient.addEventListener("error", handleWebSocketError)
        WebSocketClient.addEventListener("tablesUpdated", handleTablesUpdated)
        WebSocketClient.addEventListener("playerJoined", handlePlayerJoined)
      }
    } else {
      // Fallback to local game if WebSocket is not available
      loadTableData(tableId)
    }
  }

  // Handle WebSocket connected
  const handleWebSocketConnected = (tableId) => {
    console.log("WebSocket connected")
    loadTableData(tableId)
  }

  // Handle WebSocket disconnected
  const handleWebSocketDisconnected = () => {
    console.log("WebSocket disconnected")
  }

  // Handle tables updated
  const handleTablesUpdated = (tables) => {
    console.log("Tables updated in game.js:", tables)

    if (!Array.isArray(tables) || tables.length === 0) {
      console.log("No tables received or empty array")
      return
    }

    // Find the current table
    const urlParams = new URLSearchParams(window.location.search)
    const tableId = urlParams.get("table")

    const currentTable = tables.find((t) => t.id === tableId)

    if (currentTable) {
      console.log("Current table found in updated tables:", currentTable)

      // Update game state with the latest table data
      gameState.tableId = currentTable.id
      gameState.tableName = currentTable.name
      gameState.totalRounds = currentTable.rounds
      gameState.players = currentTable.players
      gameState.isHost = currentTable.host.id === currentUser.id
      gameState.status = currentTable.status

      // Update UI
      if (tableName) tableName.textContent = currentTable.name
      if (totalRounds) totalRounds.textContent = currentTable.rounds

      // Update waiting modal if it's open
      updateWaitingModal()

      // Store the updated table in localStorage
      const tables = JSON.parse(localStorage.getItem("blackjack_tables") || "[]")
      const existingTableIndex = tables.findIndex((t) => t.id === currentTable.id)

      if (existingTableIndex >= 0) {
        tables[existingTableIndex] = currentTable
      } else {
        tables.push(currentTable)
      }

      localStorage.setItem("blackjack_tables", JSON.stringify(tables))
      sessionStorage.setItem("shared_blackjack_tables", JSON.stringify(tables))
    } else {
      console.log("Current table not found in updated tables")
    }
  }

  // Handle player joined
  const handlePlayerJoined = (data) => {
    console.log("Player joined:", data)

    if (data && data.tableId === gameState.tableId) {
      // Request latest table data
      if (WebSocketClient && WebSocketClient.send) {
        WebSocketClient.send("getTables")
      }
    }
  }

  // Handle game started
  const handleGameStarted = (state) => {
    gameState = { ...gameState, ...state }
    closeModal(waitingModal)
    startGame()
  }

  // Handle game action received
  const handleGameActionReceived = (action) => {
    // Process game action
    if (action.action === "hit") {
      handleHitAction(action.playerId)
    } else if (action.action === "stand") {
      handleStandAction(action.playerId)
    }
  }

  // Handle table message received
  const handleTableMessageReceived = (message) => {
    addTableChatMessage(message)
  }

  // Handle WebSocket error
  const handleWebSocketError = (error) => {
    alert(error.message || "An error occurred")
  }

  // Load table data
  const loadTableData = (tableId) => {
    console.log("Loading table data for ID:", tableId)

    // Request latest tables from server
    if (WebSocketClient && WebSocketClient.send) {
      WebSocketClient.send("getTables")
    }

    // Try to get tables from sessionStorage first (shared between tabs)
    const sharedTablesKey = "shared_blackjack_tables"
    const sharedTables = sessionStorage.getItem(sharedTablesKey)
    let tables = []

    if (sharedTables) {
      tables = JSON.parse(sharedTables)
    } else {
      // Fall back to localStorage if needed
      const storedTables = JSON.parse(localStorage.getItem("blackjack_tables") || "[]")
      tables = storedTables

      // Update sessionStorage for sharing
      sessionStorage.setItem(sharedTablesKey, JSON.stringify(tables))
    }

    const table = tables.find((t) => t.id === tableId)

    if (!table) {
      console.log("Table not found in local storage, waiting for server response...")
      // Show waiting modal while we wait for server response
      showWaitingModal()
      return
    }

    // Set game state
    gameState.tableId = table.id
    gameState.tableName = table.name
    gameState.totalRounds = table.rounds
    gameState.players = table.players
    gameState.isHost = table.host.id === currentUser.id

    // Update UI
    if (tableName) tableName.textContent = table.name
    if (totalRounds) totalRounds.textContent = table.rounds

    // Check if game is already in progress
    if (table.status === "playing") {
      // Load game state
      const savedGameState = JSON.parse(localStorage.getItem(`blackjack_game_${tableId}`) || "{}")

      if (savedGameState && savedGameState.tableId) {
        gameState = { ...gameState, ...savedGameState }
        startGame()
      } else {
        showWaitingModal()
      }
    } else {
      showWaitingModal()
    }

    // Load table messages
    loadTableMessages()
  }

  // Load table messages
  const loadTableMessages = () => {
    const tableMessages = JSON.parse(localStorage.getItem("blackjack_table_messages") || "{}")

    if (gameState.tableId && tableMessages[gameState.tableId] && tableChatMessages) {
      tableChatMessages.innerHTML = ""
      tableMessages[gameState.tableId].forEach(addTableChatMessage)
    }
  }

  // Update waiting modal
  const updateWaitingModal = () => {
    // Update waiting modal content
    const waitingPlayerCount = document.getElementById("waiting-player-count")
    const waitingMaxPlayers = document.getElementById("waiting-max-players")
    const waitingPlayers = document.getElementById("waiting-players")

    if (waitingPlayerCount) waitingPlayerCount.textContent = gameState.players.length
    if (waitingMaxPlayers) waitingMaxPlayers.textContent = 4

    if (waitingPlayers) {
      waitingPlayers.innerHTML = ""

      gameState.players.forEach((player) => {
        const playerDiv = document.createElement("div")
        playerDiv.className = "waiting-player"
        playerDiv.innerHTML = `
          <img src="assets/avatars/avatar-1.png" alt="${player.username}" class="waiting-player-avatar">
          <span class="waiting-player-name">${player.username}</span>
          ${player.id === gameState.players[0].id ? '<span class="host-badge">Host</span>' : ""}
        `
        waitingPlayers.appendChild(playerDiv)
      })
    }

    // Show start game button for host
    if (startGameBtn) {
      startGameBtn.style.display = gameState.isHost ? "block" : "none"
    }
  }

  // Show waiting modal
  const showWaitingModal = () => {
    updateWaitingModal()
    openModal(waitingModal)
  }

  // Start game
  const startGame = () => {
    // Create and shuffle deck
    if (!gameState.deck || gameState.deck.length === 0) {
      gameState.deck = CardSprites.shuffleDeck(CardSprites.createDeck())
    }

    // Update UI
    if (currentRound) currentRound.textContent = gameState.currentRound

    // Render players
    renderPlayers()

    // Render dealer
    renderDealer()

    // Update scoreboard
    updateScoreboard()

    // Check if it's current user's turn
    checkCurrentTurn()
  }

  // Render players
  const renderPlayers = () => {
    if (!playersContainer) return

    playersContainer.innerHTML = ""

    // Create player positions based on max players
    const maxPlayers = Math.max(4, gameState.players.length)

    for (let i = 0; i < maxPlayers; i++) {
      const player = gameState.players.find((p) => p.position === i)
      const isCurrentPlayer = player && player.id === currentUser.id
      const isCurrentTurn = gameState.status === "playing" && gameState.currentPlayerIndex === i

      const playerDiv = document.createElement("div")
      playerDiv.className = `player-position ${player ? "" : "empty"} ${isCurrentTurn ? "active" : ""}`
      playerDiv.id = `player-position-${i}`

      if (player) {
        playerDiv.innerHTML = `
          <div class="player-info">
            <div class="player-name">${player.username} ${isCurrentPlayer ? "(You)" : ""}</div>
            <div class="player-score">${player.score || 0}</div>
          </div>
          ${player.status ? `<div class="player-status">${player.status === "bust" ? "Bust!" : player.status}</div>` : ""}
          <div class="player-cards" id="player-cards-${player.id}"></div>
        `

        // Render player cards
        const playerCardsContainer = playerDiv.querySelector(`#player-cards-${player.id}`)
        if (playerCardsContainer && player.hand && player.hand.length > 0) {
          player.hand.forEach((card) => {
            const cardElement = document.createElement("div")
            cardElement.className = "card medium"

            const img = document.createElement("img")
            img.src = card.imagePath
            img.alt = `${card.value} of ${card.suit}`
            cardElement.appendChild(img)

            playerCardsContainer.appendChild(cardElement)
          })
        }
      }

      playersContainer.appendChild(playerDiv)
    }
  }

  // Render dealer
  const renderDealer = () => {
    if (!dealerCards) return

    dealerCards.innerHTML = ""

    if (gameState.dealer.hand && gameState.dealer.hand.length > 0) {
      gameState.dealer.hand.forEach((card, index) => {
        // First card is face down if game is in progress
        const cardElement = document.createElement("div")

        if (index === 0 && gameState.status === "playing") {
          cardElement.className = "card medium face-down back"
        } else {
          cardElement.className = "card medium"

          const img = document.createElement("img")
          img.src = card.imagePath
          img.alt = `${card.value} of ${card.suit}`
          cardElement.appendChild(img)
        }

        dealerCards.appendChild(cardElement)
      })
    }

    // Update dealer score
    if (dealerScore) {
      if (gameState.status === "playing") {
        // Only show score of visible cards
        const visibleCards = gameState.dealer.hand.slice(1)
        const visibleScore = visibleCards.reduce((sum, card) => {
          return sum + (CardSprites.getCardValue ? CardSprites.getCardValue(card.rank) : 0)
        }, 0)
        dealerScore.textContent = `Score: ${visibleScore}+`
      } else {
        dealerScore.textContent = `Score: ${gameState.dealer.score || 0}`
      }
    }
  }

  // Update scoreboard
  const updateScoreboard = () => {
    if (!scoreBody) return

    scoreBody.innerHTML = ""

    // Sort players by score
    const sortedPlayers = [...gameState.players].sort((a, b) => (b.score || 0) - (a.score || 0))

    sortedPlayers.forEach((player, index) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${player.username}</td>
        <td>${player.score || 0}</td>
      `
      scoreBody.appendChild(row)
    })
  }

  // Check current turn
  const checkCurrentTurn = () => {
    if (gameState.status !== "playing") {
      return
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]

    if (currentPlayer && currentPlayer.id === currentUser.id) {
      if (hitBtn) hitBtn.disabled = false
      if (standBtn) standBtn.disabled = false
      startTimer()
      if (gameMessage) gameMessage.textContent = "Your turn!"
    } else {
      if (hitBtn) hitBtn.disabled = true
      if (standBtn) standBtn.disabled = true
      stopTimer()

      if (currentPlayer && gameMessage) {
        gameMessage.textContent = `${currentPlayer.username}'s turn...`
      }
    }
  }

  // Start timer
  const startTimer = () => {
    gameState.timeLeft = 30
    if (timerText) timerText.textContent = gameState.timeLeft + "s"
    if (timerBar) {
      timerBar.style.width = "100%"
      timerBar.classList.remove("warning", "danger")
    }

    clearInterval(gameState.timer)
    gameState.timer = setInterval(() => {
      gameState.timeLeft--
      if (timerText) timerText.textContent = gameState.timeLeft + "s"
      if (timerBar) timerBar.style.width = `${(gameState.timeLeft / 30) * 100}%`

      // Add warning classes
      if (gameState.timeLeft <= 10 && timerBar) {
        timerBar.classList.add("warning")
      }
      if (gameState.timeLeft <= 5 && timerBar) {
        timerBar.classList.add("danger")
      }

      if (gameState.timeLeft <= 0) {
        stopTimer()
        handleStandAction(currentUser.id)
      }
    }, 1000)
  }

  // Stop timer
  const stopTimer = () => {
    clearInterval(gameState.timer)
  }

  // Handle hit action
  const handleHitAction = (playerId) => {
    const playerIndex = gameState.players.findIndex((p) => p.id === playerId)

    if (playerIndex === -1 || playerIndex !== gameState.currentPlayerIndex) {
      return
    }

    const player = gameState.players[playerIndex]

    // Deal a card to the player
    if (gameState.deck.length > 0) {
      const card = gameState.deck.pop()
      player.hand = player.hand || []
      player.hand.push(card)

      // Calculate hand value
      const handValue = player.hand.reduce((sum, card) => {
        return sum + (CardSprites.getCardValue ? CardSprites.getCardValue(card.rank) : 0)
      }, 0)

      // Check for bust
      if (handValue > 21) {
        // Check for aces that can be counted as 1 instead of 11
        let aceCount = player.hand.filter((card) => card.rank === CardSprites.RANKS.ACE).length
        let adjustedValue = handValue

        while (aceCount > 0 && adjustedValue > 21) {
          adjustedValue -= 10 // Reduce ace value from 11 to 1
          aceCount--
        }

        if (adjustedValue > 21) {
          player.status = "bust"
          handleStandAction(playerId)
        }
      }

      // Update UI
      renderPlayers()
    }
  }

  // Handle stand action
  const handleStandAction = (playerId) => {
    const playerIndex = gameState.players.findIndex((p) => p.id === playerId)

    if (playerIndex === -1 || playerIndex !== gameState.currentPlayerIndex) {
      return
    }

    const player = gameState.players[playerIndex]
    player.status = player.status || "stood"

    // Move to next player
    gameState.currentPlayerIndex++

    // If all players have played, it's dealer's turn
    if (gameState.currentPlayerIndex >= gameState.players.length) {
      dealerPlay()
    } else {
      // Update UI for next player
      renderPlayers()
      checkCurrentTurn()
    }
  }

  // Dealer play
  const dealerPlay = () => {
    // Reveal dealer's hidden card with animation
    const dealerCardsElement = document.getElementById("dealer-cards")
    const hiddenCard = dealerCardsElement ? dealerCardsElement.querySelector(".card.face-down") : null

    if (hiddenCard) {
      // Add flip animation
      hiddenCard.classList.add("flipping")

      setTimeout(() => {
        // Replace with actual card
        renderDealer()

        // Continue dealer play after animation
        setTimeout(() => {
          dealerDrawCards()
        }, 500)
      }, 500)
    } else {
      // No animation needed, just continue
      renderDealer()
      dealerDrawCards()
    }
  }

  // Dealer draws cards
  const dealerDrawCards = () => {
    // Calculate dealer's hand value
    let dealerValue = gameState.dealer.hand.reduce((sum, card) => {
      return sum + (CardSprites.getCardValue ? CardSprites.getCardValue(card.rank) : 0)
    }, 0)

    // Dealer must hit until 17 or higher
    const dealerTurn = () => {
      if (dealerValue < 17) {
        // Deal a card to dealer
        if (gameState.deck.length > 0) {
          const card = gameState.deck.pop()
          gameState.dealer.hand.push(card)

          // Recalculate hand value
          dealerValue = gameState.dealer.hand.reduce((sum, card) => {
            return sum + (CardSprites.getCardValue ? CardSprites.getCardValue(card.rank) : 0)
          }, 0)

          // Check for aces if busted
          if (dealerValue > 21) {
            let aceCount = gameState.dealer.hand.filter((card) => card.rank === CardSprites.RANKS.ACE).length
            let adjustedValue = dealerValue

            while (aceCount > 0 && adjustedValue > 21) {
              adjustedValue -= 10
              aceCount--
            }

            dealerValue = adjustedValue
          }

          // Update UI
          renderDealer()

          // Continue dealer play after a delay
          setTimeout(dealerTurn, 1000)
        }
      } else {
        // Dealer stands, end the round
        endRound()
      }
    }

    // Start dealer play with a delay
    setTimeout(dealerTurn, 1000)
  }

  // End round
  const endRound = () => {
    // Calculate final scores
    const dealerValue = gameState.dealer.hand.reduce((sum, card) => {
      return sum + (CardSprites.getCardValue ? CardSprites.getCardValue(card.rank) : 0)
    }, 0)

    const dealerBusted = dealerValue > 21
    gameState.dealer.score = dealerValue

    // Determine winners
    gameState.players.forEach((player) => {
      // Calculate player's hand value
      const playerValue = player.hand.reduce((sum, card) => {
        return sum + (CardSprites.getCardValue ? CardSprites.getCardValue(card.rank) : 0)
      }, 0)

      const playerBusted = playerValue > 21

      // Update player status and score
      if (playerBusted) {
        player.status = "bust"
      } else if (dealerBusted || playerValue > dealerValue) {
        player.status = "won"
        player.score = (player.score || 0) + 10
      } else if (playerValue < dealerValue) {
        player.status = "lost"
      } else {
        player.status = "push"
      }
    })

    // Update UI
    renderDealer()
    renderPlayers()
    updateScoreboard()

    // Show round results
    showRoundResults()
  }

  // Show round results
  const showRoundResults = () => {
    // Update round results modal
    const resultDealerCards = document.getElementById("result-dealer-cards")
    const resultDealerScore = document.getElementById("result-dealer-score")
    const playersResults = document.getElementById("players-results")
    const roundSummary = document.getElementById("round-summary")

    // Clear previous results
    if (resultDealerCards) resultDealerCards.innerHTML = ""
    if (playersResults) playersResults.innerHTML = ""

    // Show dealer's cards and score
    if (resultDealerCards && resultDealerScore) {
      gameState.dealer.hand.forEach((card) => {
        const cardElement = document.createElement("div")
        cardElement.className = "card small"

        const img = document.createElement("img")
        img.src = card.imagePath
        img.alt = `${card.value} of ${card.suit}`
        cardElement.appendChild(img)

        resultDealerCards.appendChild(cardElement)
      })

      resultDealerScore.textContent = `Score: ${gameState.dealer.score}`
    }

    // Show players' results
    if (playersResults) {
      gameState.players.forEach((player) => {
        const playerResult = document.createElement("div")
        playerResult.className = "player-result"

        const playerValue = player.hand.reduce((sum, card) => {
          return sum + (CardSprites.getCardValue ? CardSprites.getCardValue(card.rank) : 0)
        }, 0)

        playerResult.innerHTML = `
          <h3>${player.username} ${player.id === currentUser.id ? "(You)" : ""}</h3>
          <div class="result-cards" id="result-player-${player.id}-cards"></div>
          <div class="result-score">Score: ${playerValue}</div>
          <div class="result-status ${player.status === "won" ? "winner" : player.status === "bust" ? "loser" : ""}">${
            player.status === "won"
              ? "Winner! +10 points"
              : player.status === "bust"
                ? "Bust!"
                : player.status === "push"
                  ? "Push (Tie)"
                  : "Lost"
          }
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
    }

    // Show round summary
    if (roundSummary) {
      const winners = gameState.players.filter((p) => p.status === "won")

      if (winners.length > 0) {
        roundSummary.innerHTML = `
          <h3>Round ${gameState.currentRound} Summary</h3>
          <p>${winners.map((p) => p.username).join(", ")} won this round!</p>
        `
      } else {
        roundSummary.innerHTML = `
          <h3>Round ${gameState.currentRound} Summary</h3>
          <p>Dealer wins this round!</p>
        `
      }
    }

    // Show next round button or game over
    if (nextRoundBtn) {
      if (gameState.currentRound >= gameState.totalRounds) {
        nextRoundBtn.textContent = "View Final Results"
        nextRoundBtn.onclick = showGameOver
      } else {
        nextRoundBtn.textContent = "Next Round"
        nextRoundBtn.onclick = startNextRound
      }
    }

    // Show modal
    openModal(roundResultsModal)
  }

  // Start next round
  const startNextRound = () => {
    // Close round results modal
    closeModal(roundResultsModal)

    // Increment round counter
    gameState.currentRound++

    // Reset round state
    gameState.deck = CardSprites.shuffleDeck(CardSprites.createDeck())
    gameState.dealer.hand = []
    gameState.currentPlayerIndex = 0

    gameState.players.forEach((player) => {
      player.hand = []
      player.status = "playing"
    })

    // Deal initial cards
    // First card for each player
    gameState.players.forEach((player) => {
      player.hand.push(gameState.deck.pop())
    })

    // First card for dealer
    gameState.dealer.hand.push(gameState.deck.pop())

    // Second card for each player
    gameState.players.forEach((player) => {
      player.hand.push(gameState.deck.pop())
    })

    // Second card for dealer
    gameState.dealer.hand.push(gameState.deck.pop())

    // Update UI
    if (currentRound) currentRound.textContent = gameState.currentRound
    renderDealer()
    renderPlayers()

    // Start first player's turn
    checkCurrentTurn()
  }

  // Show game over
  const showGameOver = () => {
    // Close round results modal
    closeModal(roundResultsModal)

    // Update game over modal
    const finalScores = document.getElementById("final-scores")
    const winnerAnnouncement = document.getElementById("winner-announcement")

    // Sort players by score
    const sortedPlayers = [...gameState.players].sort((a, b) => (b.score || 0) - (a.score || 0))

    // Show final scores
    if (finalScores) {
      finalScores.innerHTML = `
        <h3>Final Scores</h3>
        <table class="results-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            ${sortedPlayers
              .map(
                (player, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${player.username} ${player.id === currentUser.id ? "(You)" : ""}</td>
                  <td>${player.score || 0}</td>
                </tr>
              `,
              )
              .join("")}
          </tbody>
        </table>
      `
    }

    // Show winner announcement
    if (winnerAnnouncement) {
      const winner = sortedPlayers[0]
      const isWinnerCurrentUser = winner.id === currentUser.id

      winnerAnnouncement.innerHTML = `
        <h3>${winner.username} ${isWinnerCurrentUser ? "(You)" : ""} Wins!</h3>
        <p>With a score of ${winner.score || 0} points</p>
      `
    }

    // Show modal
    openModal(gameOverModal)
  }

  // Add table chat message
  const addTableChatMessage = (message) => {
    if (!tableChatMessages) return

    const messageDiv = document.createElement("div")
    messageDiv.className = "chat-message"

    if (message.senderId === currentUser.id) {
      messageDiv.classList.add("own-message")
    }

    const timestamp = new Date(message.timestamp)
    const timeString = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    messageDiv.innerHTML = `
      <div class="chat-message-sender">${message.senderId === currentUser.id ? "You" : message.senderName}</div>
      <div class="chat-message-content">${message.message}</div>
      <div class="chat-message-time">${timeString}</div>
    `

    tableChatMessages.appendChild(messageDiv)
    tableChatMessages.scrollTop = tableChatMessages.scrollHeight
  }

  // Open modal
  const openModal = (modal) => {
    if (modal) modal.classList.add("active")
  }

  // Close modal
  const closeModal = (modal) => {
    if (modal) modal.classList.remove("active")
  }

  // Event listeners
  if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
      if (WebSocketClient && WebSocketClient.send) {
        WebSocketClient.send("startGame", {
          tableId: gameState.tableId,
        })
      } else {
        // Fallback for local testing
        handleGameStarted({
          status: "playing",
        })
      }
    })
  }

  if (cancelGameBtn) {
    cancelGameBtn.addEventListener("click", () => {
      window.location.href = "lobby.html"
    })
  }

  if (hitBtn) {
    hitBtn.addEventListener("click", () => {
      if (WebSocketClient && WebSocketClient.send) {
        WebSocketClient.send("gameAction", {
          action: "hit",
          tableId: gameState.tableId,
          playerId: currentUser.id,
        })
      } else {
        // Fallback for local testing
        handleHitAction(currentUser.id)
      }
    })
  }

  if (standBtn) {
    standBtn.addEventListener("click", () => {
      if (WebSocketClient && WebSocketClient.send) {
        WebSocketClient.send("gameAction", {
          action: "stand",
          tableId: gameState.tableId,
          playerId: currentUser.id,
        })
      } else {
        // Fallback for local testing
        handleStandAction(currentUser.id)
      }
    })
  }

  if (sendTableChat && tableChatInput) {
    sendTableChat.addEventListener("click", () => {
      const message = tableChatInput.value.trim()

      if (message) {
        if (WebSocketClient && WebSocketClient.send) {
          WebSocketClient.send("tableMessage", {
            tableId: gameState.tableId,
            message: message,
          })
        } else {
          // Fallback for local testing
          const messageObj = {
            id: `msg_${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.username,
            message: message,
            timestamp: new Date().toISOString(),
          }
          addTableChatMessage(messageObj)
        }

        tableChatInput.value = ""
      }
    })
  }

  if (tableChatInput) {
    tableChatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && sendTableChat) {
        sendTableChat.click()
      }
    })
  }

  if (leaveTableBtn) {
    leaveTableBtn.addEventListener("click", () => {
      if (WebSocketClient && WebSocketClient.send) {
        WebSocketClient.send("leaveTable", {
          tableId: gameState.tableId,
        })
      }

      window.location.href = "lobby.html"
    })
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      window.location.reload()
    })
  }

  if (returnLobbyBtn) {
    returnLobbyBtn.addEventListener("click", () => {
      window.location.href = "lobby.html"
    })
  }

  // Initialize
  initGame()
})

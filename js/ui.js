// UI updates and rendering

// Check if UI already exists to avoid redefinition
if (!window.UI) {
  // Import Cards if it exists, otherwise create an empty object
  const Cards = window.Cards || {}

  const UI = {
    // DOM elements
    elements: {},

    // Initialize UI
    init: function () {
      // Find DOM elements
      this.elements = {
        setupScreen: document.getElementById("setup-screen"),
        gameScreen: document.getElementById("game-screen"),
        resultsScreen: document.getElementById("results-screen"),

        setupForm: document.getElementById("setup-form"),
        playerCount: document.getElementById("player-count"),
        playerNamesContainer: document.getElementById("player-names-container"),
        rounds: document.getElementById("rounds"),
        timeout: document.getElementById("timeout"),

        currentRound: document.getElementById("current-round"),
        totalRounds: document.getElementById("total-rounds"),
        timeLeft: document.getElementById("time-left"),

        dealerCards: document.getElementById("dealer-cards"),
        dealerScore: document.getElementById("dealer-score"),
        playersContainer: document.getElementById("players-container"),

        hitBtn: document.getElementById("hit-btn"),
        standBtn: document.getElementById("stand-btn"),

        scoreTable: document.getElementById("score-table"),
        scoreBody: document.getElementById("score-body"),

        finalScores: document.getElementById("final-scores"),
        winnerAnnouncement: document.getElementById("winner-announcement"),
        newGameBtn: document.getElementById("new-game-btn"),

        messageModal: document.getElementById("message-modal"),
        modalTitle: document.getElementById("modal-title"),
        modalMessage: document.getElementById("modal-message"),
        modalClose: document.getElementById("modal-close"),
      }

      // Set up player count change event
      if (this.elements.playerCount) {
        this.elements.playerCount.addEventListener("change", () => {
          this.updatePlayerNameFields()
        })
      }

      // Set up modal close button
      if (this.elements.modalClose) {
        this.elements.modalClose.addEventListener("click", () => {
          this.hideModal()
        })
      }

      // Initial player name fields
      if (this.elements.playerCount) {
        this.updatePlayerNameFields()
      }
    },

    // Update player name input fields based on player count
    updatePlayerNameFields: function () {
      if (!this.elements.playerCount || !this.elements.playerNamesContainer) return

      const count = Number.parseInt(this.elements.playerCount.value)
      let html = ""

      for (let i = 1; i <= count; i++) {
        html += `
          <div class="form-group">
            <label for="player${i}">Player ${i} Name:</label>
            <input type="text" id="player${i}" required>
          </div>
        `
      }

      this.elements.playerNamesContainer.innerHTML = html
    },

    // Show a specific screen
    showScreen: function (screenId) {
      // Hide all screens
      if (this.elements.setupScreen) this.elements.setupScreen.classList.remove("active")
      if (this.elements.gameScreen) this.elements.gameScreen.classList.remove("active")
      if (this.elements.resultsScreen) this.elements.resultsScreen.classList.remove("active")

      // Show the requested screen
      const screen = document.getElementById(screenId)
      if (screen) screen.classList.add("active")
    },

    // Update game info
    updateGameInfo: function (currentRound, totalRounds) {
      if (this.elements.currentRound) this.elements.currentRound.textContent = currentRound
      if (this.elements.totalRounds) this.elements.totalRounds.textContent = totalRounds
    },

    // Update timer
    updateTimer: function (seconds) {
      if (!this.elements.timeLeft) return

      this.elements.timeLeft.textContent = seconds

      // Add warning class if time is running low
      if (seconds <= 10) {
        this.elements.timeLeft.parentElement.classList.add("warning")
      } else {
        this.elements.timeLeft.parentElement.classList.remove("warning")
      }
    },

    // Render dealer's cards
    renderDealerCards: function (cards, hideFirst = false) {
      if (!this.elements.dealerCards) return

      let html = ""

      cards.forEach((card, index) => {
        if (index === 0 && hideFirst) {
          html += `
            <div class="card face-down">
            </div>
          `
        } else {
          html += `
            <div class="card" style="color: ${card.color}">
              <img src="${card.imagePath}" alt="${card.value} of ${card.suit}" class="card-image">
            </div>
          `
        }
      })

      this.elements.dealerCards.innerHTML = html

      // Update dealer score
      if (!this.elements.dealerScore) return

      if (hideFirst) {
        // Only show the value of the visible card
        const visibleCards = cards.slice(1)
        const score = Cards.calculateHandValue ? Cards.calculateHandValue(visibleCards) : 0
        this.elements.dealerScore.textContent = `Score: ${score}+`
      } else {
        const score = Cards.calculateHandValue ? Cards.calculateHandValue(cards) : 0
        this.elements.dealerScore.textContent = `Score: ${score}`
      }
    },

    // Render players' areas
    renderPlayers: function (players, currentPlayerIndex) {
      if (!this.elements.playersContainer) return

      let html = ""

      players.forEach((player, index) => {
        const isActive = index === currentPlayerIndex
        const handValue = Cards.calculateHandValue ? Cards.calculateHandValue(player.hand) : 0
        const isBusted = Cards.isBusted ? Cards.isBusted(player.hand) : false
        const hasStood = player.stood

        html += `
          <div class="player-area ${isActive ? "active" : ""}">
            <h3>${player.name} ${isBusted ? "(Busted)" : ""} ${hasStood ? "(Stood)" : ""}</h3>
            <div class="cards-container" id="player-${index}-cards">
              ${this.renderPlayerCards(player.hand)}
            </div>
            <div class="score">Score: ${handValue}</div>
          </div>
        `
      })

      this.elements.playersContainer.innerHTML = html
    },

    // Render player cards
    renderPlayerCards: (cards) => {
      let html = ""

      cards.forEach((card) => {
        html += `
          <div class="card" style="color: ${card.color}">
            <img src="${card.imagePath}" alt="${card.value} of ${card.suit}" class="card-image">
          </div>
        `
      })

      return html
    },

    // Update scoreboard
    updateScoreboard: function (players, dealer) {
      if (!this.elements.scoreBody) return

      let html = ""

      // Add dealer
      html += `
        <tr>
          <td>Dealer</td>
          <td>${dealer.score}</td>
        </tr>
      `

      // Add players
      players.forEach((player) => {
        html += `
          <tr>
            <td>${player.name}</td>
            <td>${player.score}</td>
          </tr>
        `
      })

      this.elements.scoreBody.innerHTML = html
    },

    // Update game controls
    updateControls: function (canHit, canStand) {
      if (this.elements.hitBtn) this.elements.hitBtn.disabled = !canHit
      if (this.elements.standBtn) this.elements.standBtn.disabled = !canStand
    },

    // Show final results
    showResults: function (players, dealer) {
      if (!this.elements.finalScores) return

      let html = '<table class="results-table"><thead><tr><th>Player</th><th>Score</th></tr></thead><tbody>'

      // Add dealer
      html += `
        <tr>
          <td>Dealer</td>
          <td>${dealer.score}</td>
        </tr>
      `

      // Add players
      players.forEach((player) => {
        html += `
          <tr>
            <td>${player.name}</td>
            <td>${player.score}</td>
          </tr>
        `
      })

      html += "</tbody></table>"

      this.elements.finalScores.innerHTML = html

      // Determine winner
      if (!this.elements.winnerAnnouncement) return

      let winner
      let maxScore = dealer.score

      if (maxScore > 0) {
        winner = "Dealer"
      }

      players.forEach((player) => {
        if (player.score > maxScore) {
          maxScore = player.score
          winner = player.name
        } else if (player.score === maxScore && maxScore > 0) {
          winner += ` and ${player.name}`
        }
      })

      this.elements.winnerAnnouncement.textContent = `Winner: ${winner}!`
    },

    // Show modal with message
    showModal: function (title, message) {
      if (!this.elements.modalTitle || !this.elements.modalMessage || !this.elements.messageModal) return

      this.elements.modalTitle.textContent = title
      this.elements.modalMessage.textContent = message
      this.elements.messageModal.classList.add("active")
    },

    // Hide modal
    hideModal: function () {
      if (!this.elements.messageModal) return

      this.elements.messageModal.classList.remove("active")
    },
  }

  // Initialize UI when DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    UI.init()
  })

  // Make UI available globally
  window.UI = UI
}

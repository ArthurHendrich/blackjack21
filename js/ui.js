// UI updates and rendering

// Assuming Cards is defined in another file, import it or define it here.
// For example:
// import Cards from './cards.js';
// Or, if Cards is a global object:
const Cards = window.Cards || {} // Check if it exists, otherwise initialize as an empty object

const UI = {
  // DOM elements
  elements: {
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
  },

  // Initialize UI
  init: function () {
    // Set up player count change event
    this.elements.playerCount.addEventListener("change", () => {
      this.updatePlayerNameFields()
    })

    // Set up modal close button
    this.elements.modalClose.addEventListener("click", () => {
      this.hideModal()
    })

    // Initial player name fields
    this.updatePlayerNameFields()
  },

  // Update player name input fields based on player count
  updatePlayerNameFields: function () {
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
    this.elements.setupScreen.classList.remove("active")
    this.elements.gameScreen.classList.remove("active")
    this.elements.resultsScreen.classList.remove("active")

    // Show the requested screen
    document.getElementById(screenId).classList.add("active")
  },

  // Update game info
  updateGameInfo: function (currentRound, totalRounds) {
    this.elements.currentRound.textContent = currentRound
    this.elements.totalRounds.textContent = totalRounds
  },

  // Update timer
  updateTimer: function (seconds) {
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
    if (hideFirst) {
      // Only show the value of the visible card
      const visibleCards = cards.slice(1)
      const score = Cards.calculateHandValue(visibleCards)
      this.elements.dealerScore.textContent = `Score: ${score}+`
    } else {
      const score = Cards.calculateHandValue(cards)
      this.elements.dealerScore.textContent = `Score: ${score}`
    }
  },

  // Render players' areas
  renderPlayers: function (players, currentPlayerIndex) {
    let html = ""

    players.forEach((player, index) => {
      const isActive = index === currentPlayerIndex
      const handValue = Cards.calculateHandValue(player.hand)
      const isBusted = Cards.isBusted(player.hand)
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
    this.elements.hitBtn.disabled = !canHit
    this.elements.standBtn.disabled = !canStand
  },

  // Show final results
  showResults: function (players, dealer) {
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
    this.elements.modalTitle.textContent = title
    this.elements.modalMessage.textContent = message
    this.elements.messageModal.classList.add("active")
  },

  // Hide modal
  hideModal: function () {
    this.elements.messageModal.classList.remove("active")
  },
}

// Initialize UI when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  UI.init()
})

// Make UI available globally
window.UI = UI

// Import Game and UI modules
import { Game } from "./game.js"
import { UI } from "./ui.js"

// Game setup logic

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const setupForm = document.getElementById("setup-form")
  const hitBtn = document.getElementById("hit-btn")
  const standBtn = document.getElementById("stand-btn")
  const newGameBtn = document.getElementById("new-game-btn")

  // Set up event listeners
  setupForm.addEventListener("submit", handleSetupFormSubmit)
  hitBtn.addEventListener("click", handleHitClick)
  standBtn.addEventListener("click", handleStandClick)
  newGameBtn.addEventListener("click", handleNewGameClick)

  // Handle setup form submission
  function handleSetupFormSubmit(event) {
    event.preventDefault()

    // Get form values
    const playerCount = Number.parseInt(document.getElementById("player-count").value)
    const rounds = Number.parseInt(document.getElementById("rounds").value)
    const timeout = Number.parseInt(document.getElementById("timeout").value)

    // Get player names
    const playerNames = []
    for (let i = 1; i <= playerCount; i++) {
      const nameInput = document.getElementById(`player${i}`)
      playerNames.push(nameInput.value)
    }

    // Initialize game
    Game.init(playerNames, rounds, timeout)

    // Show game screen
    UI.showScreen("game-screen")
  }

  // Handle hit button click
  function handleHitClick() {
    Game.hit()
  }

  // Handle stand button click
  function handleStandClick() {
    Game.stand()
  }

  // Handle new game button click
  function handleNewGameClick() {
    // Show setup screen
    UI.showScreen("setup-screen")
  }
})

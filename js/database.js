// Database operations using localStorage as a simple NoSQL-like storage
// In a real application, this would be replaced with actual NoSQL database calls

const Database = {
  // Initialize the database
  init: () => {
    // Check if database is already initialized
    if (!localStorage.getItem("blackjack_games")) {
      localStorage.setItem("blackjack_games", JSON.stringify([]))
    }
    if (!localStorage.getItem("blackjack_players")) {
      localStorage.setItem("blackjack_players", JSON.stringify([]))
    }
    if (!localStorage.getItem("blackjack_rounds")) {
      localStorage.setItem("blackjack_rounds", JSON.stringify([]))
    }
  },

  // Game operations
  games: {
    create: (gameData) => {
      const games = JSON.parse(localStorage.getItem("blackjack_games"))
      const gameId = Date.now().toString()
      const newGame = {
        id: gameId,
        ...gameData,
        timestamp: new Date().toISOString(),
      }
      games.push(newGame)
      localStorage.setItem("blackjack_games", JSON.stringify(games))
      return gameId
    },

    update: (gameId, updateData) => {
      const games = JSON.parse(localStorage.getItem("blackjack_games"))
      const gameIndex = games.findIndex((game) => game.id === gameId)

      if (gameIndex !== -1) {
        games[gameIndex] = { ...games[gameIndex], ...updateData }
        localStorage.setItem("blackjack_games", JSON.stringify(games))
        return true
      }
      return false
    },

    get: (gameId) => {
      const games = JSON.parse(localStorage.getItem("blackjack_games"))
      return games.find((game) => game.id === gameId) || null
    },

    getAll: () => JSON.parse(localStorage.getItem("blackjack_games")),
  },

  // Player operations
  players: {
    create: (gameId, playerData) => {
      const players = JSON.parse(localStorage.getItem("blackjack_players"))
      const playerId = `${gameId}_${Date.now()}`
      const newPlayer = {
        id: playerId,
        gameId,
        ...playerData,
      }
      players.push(newPlayer)
      localStorage.setItem("blackjack_players", JSON.stringify(players))
      return playerId
    },

    update: (playerId, updateData) => {
      const players = JSON.parse(localStorage.getItem("blackjack_players"))
      const playerIndex = players.findIndex((player) => player.id === playerId)

      if (playerIndex !== -1) {
        players[playerIndex] = { ...players[playerIndex], ...updateData }
        localStorage.setItem("blackjack_players", JSON.stringify(players))
        return true
      }
      return false
    },

    getByGame: (gameId) => {
      const players = JSON.parse(localStorage.getItem("blackjack_players"))
      return players.filter((player) => player.gameId === gameId)
    },
  },

  // Round operations
  rounds: {
    create: (gameId, roundData) => {
      const rounds = JSON.parse(localStorage.getItem("blackjack_rounds"))
      const roundId = `${gameId}_${Date.now()}`
      const newRound = {
        id: roundId,
        gameId,
        ...roundData,
        timestamp: new Date().toISOString(),
      }
      rounds.push(newRound)
      localStorage.setItem("blackjack_rounds", JSON.stringify(rounds))
      return roundId
    },

    getByGame: (gameId) => {
      const rounds = JSON.parse(localStorage.getItem("blackjack_rounds"))
      return rounds.filter((round) => round.gameId === gameId)
    },
  },
}

// Initialize database on script load
Database.init()

const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")
const ip = require("ip")
const connectDB = require("./config/database")
require("dotenv").config()

// Conectar ao MongoDB
connectDB()

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  // Configurações para melhorar a estabilidade da conexão
  pingTimeout: 60000, // 60 segundos para timeout de ping
  pingInterval: 25000, // 25 segundos entre pings
})

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "/")))

// Estado do jogo - Objeto global compartilhado entre todas as conexões
const gameState = {
  tables: [],
  onlineUsers: [],
  globalMessages: [],
  disconnectedUsers: {}, // Armazenar usuários desconectados temporariamente
  userSocketMap: {}, // Mapear IDs de usuário para IDs de socket
}

// Tempo de tolerância para reconexão (em milissegundos)
const RECONNECT_TIMEOUT = 30000 // 30 segundos (aumentado de 10 para 30)

// Função para enviar atualizações de mesas para todos os clientes
function broadcastTables() {
  console.log(`Enviando atualização de mesas para todos os clientes: ${gameState.tables.length} mesas`)
  io.emit("tablesUpdated", gameState.tables)
}

// Função para enviar atualizações de usuários online para todos os clientes
function broadcastOnlineUsers() {
  console.log(`Enviando atualização de usuários para todos os clientes: ${gameState.onlineUsers.length} usuários`)
  io.emit("onlineUsersUpdated", gameState.onlineUsers)
}

// Função para enviar atualizações de mesas para um cliente específico
function sendTablesToClient(socket) {
  console.log(`Enviando ${gameState.tables.length} mesas para o cliente ${socket.id}`)
  socket.emit("tablesUpdated", gameState.tables)
}

// Manipular conexões de socket
io.on("connection", (socket) => {
  console.log(`Novo jogador conectado: ${socket.id}`)

  // Autenticação do usuário
  socket.on("authenticate", (userData) => {
    // Verificar se o usuário estava desconectado temporariamente
    const userId = userData.id
    const username = userData.username

    // Atualizar o mapeamento de usuário para socket
    gameState.userSocketMap[userId] = socket.id

    // Limpar qualquer timeout de reconexão pendente
    if (gameState.disconnectedUsers[userId]) {
      clearTimeout(gameState.disconnectedUsers[userId].timeout)
      delete gameState.disconnectedUsers[userId]
      console.log(`Usuário reconectado: ${username} (ID: ${userId})`)
    }

    // Verificar se o usuário já está online (reconexão)
    const existingUserIndex = gameState.onlineUsers.findIndex((u) => u.id === userId)

    if (existingUserIndex !== -1) {
      console.log(
        `Usuário reconectado: ${username} (antigo ID: ${gameState.onlineUsers[existingUserIndex].id}, novo ID: ${socket.id})`,
      )

      // Atualizar o ID do socket para o usuário existente
      const oldSocketId = gameState.onlineUsers[existingUserIndex].id
      gameState.onlineUsers[existingUserIndex].id = socket.id

      // Atualizar o ID do socket em todas as mesas onde o usuário está
      gameState.tables.forEach((table) => {
        const playerIndex = table.players.findIndex((p) => p.id === userId)
        if (playerIndex !== -1) {
          // Manter o ID do usuário, mas atualizar o ID do socket
          table.players[playerIndex].socketId = socket.id

          // Se o usuário é o host, atualizar o ID do socket do host também
          if (table.host.id === userId) {
            table.host.socketId = socket.id
          }
        }
      })
    } else {
      // Adicionar novo usuário à lista de usuários online
      const user = {
        id: userId,
        socketId: socket.id,
        username: username,
        status: "online",
        lastActive: new Date().toISOString(),
      }

      gameState.onlineUsers.push(user)
      console.log(`Novo usuário autenticado: ${username}`)
    }

    // Enviar estado atual do jogo para o novo usuário
    socket.emit("gameState", gameState)

    // Notificar todos os usuários sobre o novo jogador
    broadcastOnlineUsers()
    broadcastTables()

    console.log(`Usuário autenticado: ${username}`)
  })

  // Obter mesas
  socket.on("getTables", () => {
    sendTablesToClient(socket)
  })

  // Criar mesa
  socket.on("createTable", (tableData) => {
    const tableId = `table_${Date.now()}`
    const user = gameState.onlineUsers.find((u) => u.socketId === socket.id)

    if (!user) {
      socket.emit("error", { message: "Usuário não autenticado" })
      return
    }

    const newTable = {
      id: tableId,
      name: tableData.name,
      host: {
        id: user.id,
        username: user.username,
        socketId: socket.id,
      },
      maxPlayers: tableData.maxPlayers,
      rounds: tableData.rounds,
      timeout: tableData.timeout,
      level: tableData.level,
      hasPassword: !!tableData.password,
      password: tableData.password || "",
      players: [
        {
          id: user.id,
          username: user.username,
          socketId: socket.id,
          position: 0,
          status: "waiting",
        },
      ],
      status: "waiting",
      createdAt: new Date().toISOString(),
    }

    // Adicionar mesa à lista de mesas
    gameState.tables.push(newTable)

    // Atualizar status do usuário
    user.status = "in_table"
    user.tableId = tableId
    user.lastActive = new Date().toISOString()

    // Notificar todos os usuários sobre a nova mesa
    broadcastTables()
    broadcastOnlineUsers()

    // Notificar o criador da mesa
    socket.emit("tableCreated", newTable)

    console.log(`Mesa criada: ${newTable.name} por ${user.username} (ID: ${tableId})`)
    console.log(`Total de mesas ativas: ${gameState.tables.length}`)
  })

  // Entrar em uma mesa
  socket.on("joinTable", (data) => {
    const tableId = data.tableId
    const password = data.password
    const user = gameState.onlineUsers.find((u) => u.socketId === socket.id)

    if (!user) {
      socket.emit("error", { message: "Usuário não autenticado" })
      return
    }

    const table = gameState.tables.find((t) => t.id === tableId)

    if (!table) {
      socket.emit("error", { message: "Mesa não encontrada" })
      return
    }

    // Verificar se a mesa está cheia
    if (table.players.length >= table.maxPlayers) {
      socket.emit("error", { message: "Mesa cheia" })
      return
    }

    // Verificar senha se necessário
    if (table.hasPassword && table.password !== password) {
      socket.emit("error", { message: "Senha incorreta" })
      return
    }

    // Verificar se o jogador já está na mesa
    if (table.players.some((p) => p.id === user.id)) {
      socket.emit("error", { message: "Você já está nesta mesa" })
      return
    }

    // Adicionar jogador à mesa
    table.players.push({
      id: user.id,
      username: user.username,
      socketId: socket.id,
      position: table.players.length,
      status: "waiting",
    })

    // Atualizar status do usuário
    user.status = "in_table"
    user.tableId = tableId
    user.lastActive = new Date().toISOString()

    // Notificar todos os usuários sobre a atualização da mesa
    broadcastTables()
    broadcastOnlineUsers()

    // Notificar o jogador que entrou
    socket.emit("tableJoined", table)

    // Notificar todos os jogadores na mesa
    table.players.forEach((player) => {
      if (player.id !== user.id) {
        const playerSocket = io.sockets.sockets.get(player.socketId)
        if (playerSocket) {
          playerSocket.emit("playerJoined", {
            tableId,
            player: {
              id: user.id,
              username: user.username,
            },
          })
        }
      }
    })

    console.log(`${user.username} entrou na mesa: ${table.name}`)
  })

  // Sair de uma mesa
  socket.on("leaveTable", () => {
    const user = gameState.onlineUsers.find((u) => u.socketId === socket.id)

    if (!user || !user.tableId) return

    const tableIndex = gameState.tables.findIndex((t) => t.id === user.tableId)

    if (tableIndex === -1) return

    const table = gameState.tables[tableIndex]
    const playerIndex = table.players.findIndex((p) => p.id === user.id)

    if (playerIndex !== -1) {
      // Remover jogador da mesa
      table.players.splice(playerIndex, 1)

      // Se não houver mais jogadores, remover a mesa
      if (table.players.length === 0) {
        gameState.tables.splice(tableIndex, 1)
        console.log(`Mesa removida: ${table.name} (sem jogadores)`)
      } else {
        // Se o host saiu, atribuir novo host
        if (table.host.id === user.id) {
          table.host = {
            id: table.players[0].id,
            username: table.players[0].username,
            socketId: table.players[0].socketId,
          }
          console.log(`Novo host da mesa ${table.name}: ${table.host.username}`)
        }

        // Atualizar posições
        table.players.forEach((player, index) => {
          player.position = index
        })
      }

      // Atualizar status do usuário
      user.status = "online"
      delete user.tableId
      user.lastActive = new Date().toISOString()

      // Notificar todos os usuários sobre a atualização da mesa
      broadcastTables()
      broadcastOnlineUsers()

      // Notificar o jogador que saiu
      socket.emit("tableLeft")

      console.log(`${user.username} saiu da mesa: ${table.name}`)
    }
  })

  // Iniciar jogo
  socket.on("startGame", (data) => {
    const tableId = data.tableId
    const user = gameState.onlineUsers.find((u) => u.socketId === socket.id)

    if (!user) return

    const table = gameState.tables.find((t) => t.id === tableId)

    if (!table) {
      socket.emit("error", { message: "Mesa não encontrada" })
      return
    }

    // Verificar se o usuário é o host
    if (table.host.id !== user.id) {
      socket.emit("error", { message: "Apenas o host pode iniciar o jogo" })
      return
    }

    // Atualizar status da mesa
    table.status = "playing"
    table.players.forEach((player) => {
      player.status = "playing"
    })

    // Criar baralho
    const deck = createDeck()

    // Inicializar estado do jogo
    const game = {
      tableId,
      currentRound: 1,
      totalRounds: table.rounds,
      currentPlayerIndex: 0,
      deck,
      dealer: {
        hand: [],
        score: 0,
      },
      players: table.players.map((player) => ({
        id: player.id,
        username: player.username,
        position: player.position,
        hand: [],
        score: 0,
        status: "playing",
      })),
      status: "dealing",
      timestamp: new Date().toISOString(),
    }

    // Distribuir cartas iniciais
    dealInitialCards(game)

    // Notificar todos os jogadores na mesa
    table.players.forEach((player) => {
      const playerSocket = io.sockets.sockets.get(player.socketId)
      if (playerSocket) {
        playerSocket.emit("gameStarted", game)
      }
    })

    // Notificar todos os usuários sobre a atualização da mesa
    broadcastTables()

    console.log(`Jogo iniciado na mesa: ${table.name}`)
  })

  // Ação do jogo (hit, stand)
  socket.on("gameAction", (data) => {
    const action = data.action
    const tableId = data.tableId
    const user = gameState.onlineUsers.find((u) => u.socketId === socket.id)

    if (!user) return

    const table = gameState.tables.find((t) => t.id === tableId)

    if (!table || table.status !== "playing") {
      socket.emit("error", { message: "Mesa não encontrada ou jogo não iniciado" })
      return
    }

    // Notificar todos os jogadores na mesa sobre a ação
    table.players.forEach((player) => {
      const playerSocket = io.sockets.sockets.get(player.socketId)
      if (playerSocket) {
        playerSocket.emit("gameActionReceived", {
          action,
          playerId: user.id,
          username: user.username,
          timestamp: new Date().toISOString(),
        })
      }
    })

    console.log(`${user.username} realizou ação: ${action}`)
  })

  // Mensagem de chat da mesa
  socket.on("tableMessage", (data) => {
    const tableId = data.tableId
    const message = data.message
    const user = gameState.onlineUsers.find((u) => u.socketId === socket.id)

    if (!user || !message) return

    const table = gameState.tables.find((t) => t.id === tableId)

    if (!table) return

    const chatMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderName: user.username,
      message,
      timestamp: new Date().toISOString(),
    }

    // Notificar todos os jogadores na mesa
    table.players.forEach((player) => {
      const playerSocket = io.sockets.sockets.get(player.socketId)
      if (playerSocket) {
        playerSocket.emit("tableMessageReceived", chatMessage)
      }
    })

    console.log(`${user.username} enviou mensagem na mesa: ${table.name}`)
  })

  // Mensagem de chat global
  socket.on("globalMessage", (data) => {
    const message = data.message
    const user = gameState.onlineUsers.find((u) => u.socketId === socket.id)

    if (!user || !message) return

    const chatMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderName: user.username,
      message,
      timestamp: new Date().toISOString(),
    }

    // Adicionar mensagem ao histórico
    gameState.globalMessages.push(chatMessage)

    // Limitar o histórico a 100 mensagens
    if (gameState.globalMessages.length > 100) {
      gameState.globalMessages.shift()
    }

    // Notificar todos os usuários
    io.emit("globalMessageReceived", chatMessage)

    console.log(`${user.username} enviou mensagem global: ${message}`)
  })

  // Desconexão
  socket.on("disconnect", () => {
    // Encontrar usuário pelo ID do socket
    const userIndex = gameState.onlineUsers.findIndex((u) => u.socketId === socket.id)

    if (userIndex !== -1) {
      const user = gameState.onlineUsers[userIndex]

      console.log(
        `Jogador desconectado temporariamente: ${user.username} (aguardando reconexão por ${RECONNECT_TIMEOUT / 1000}s)`,
      )

      // Armazenar o usuário desconectado temporariamente
      gameState.disconnectedUsers[user.id] = {
        user: user,
        timestamp: Date.now(),
        timeout: setTimeout(() => {
          // Verificar se o usuário ainda está na lista de desconectados
          if (gameState.disconnectedUsers[user.id]) {
            console.log(`Tempo de reconexão expirado para ${user.username}`)

            // Remover usuário da lista de usuários online
            const currentUserIndex = gameState.onlineUsers.findIndex((u) => u.id === user.id)
            if (currentUserIndex !== -1) {
              gameState.onlineUsers.splice(currentUserIndex, 1)
            }

            // Se o usuário estava em uma mesa, verificar se era o host
            if (user.tableId) {
              const tableIndex = gameState.tables.findIndex((t) => t.id === user.tableId)

              if (tableIndex !== -1) {
                const table = gameState.tables[tableIndex]
                const playerIndex = table.players.findIndex((p) => p.id === user.id)

                if (playerIndex !== -1) {
                  // Remover jogador da mesa
                  table.players.splice(playerIndex, 1)

                  // Se não houver mais jogadores, remover a mesa
                  if (table.players.length === 0) {
                    gameState.tables.splice(tableIndex, 1)
                    console.log(`Mesa removida: ${table.name} (sem jogadores)`)
                  } else {
                    // Se o host saiu, atribuir novo host
                    if (table.host.id === user.id) {
                      table.host = {
                        id: table.players[0].id,
                        username: table.players[0].username,
                        socketId: table.players[0].socketId,
                      }
                      console.log(`Novo host da mesa ${table.name}: ${table.host.username}`)
                    }

                    // Atualizar posições
                    table.players.forEach((player, index) => {
                      player.position = index
                    })
                  }
                }
              }
            }

            // Notificar todos os usuários sobre a saída do usuário
            io.emit("userLeft", user)
            broadcastOnlineUsers()
            broadcastTables()

            console.log(`Jogador desconectado permanentemente: ${user.username}`)

            // Remover da lista de desconectados
            delete gameState.disconnectedUsers[user.id]
          }
        }, RECONNECT_TIMEOUT),
      }
    }
  })
})

// Funções auxiliares
function createDeck() {
  const suits = ["hearts", "diamonds", "clubs", "spades"]
  const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]
  const deck = []

  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        suit,
        value,
        displayValue: value,
        suitSymbol: getSuitSymbol(suit),
        color: suit === "hearts" || suit === "diamonds" ? "red" : "black",
        imagePath: `assets/cards/${value}${suit.charAt(0).toUpperCase()}.gif`,
      })
    }
  }

  // Embaralhar o baralho
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }

  return deck
}

function getSuitSymbol(suit) {
  switch (suit) {
    case "hearts":
      return "♥"
    case "diamonds":
      return "♦"
    case "clubs":
      return "♣"
    case "spades":
      return "♠"
    default:
      return ""
  }
}

function dealInitialCards(game) {
  // Distribuir primeira carta para cada jogador
  game.players.forEach((player) => {
    player.hand.push(game.deck.pop())
  })

  // Distribuir primeira carta para o dealer
  game.dealer.hand.push(game.deck.pop())

  // Distribuir segunda carta para cada jogador
  game.players.forEach((player) => {
    player.hand.push(game.deck.pop())
  })

  // Distribuir segunda carta para o dealer
  game.dealer.hand.push(game.deck.pop())
}

// Iniciar servidor
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  const localIp = ip.address()
  console.log(`Servidor BlackjackPro rodando em:`)
  console.log(`- Local: http://localhost:${PORT}`)
  console.log(`- Rede LAN: http://${localIp}:${PORT}`)
})

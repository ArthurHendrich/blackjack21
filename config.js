// Configurações do servidor
module.exports = {
  // Porta do servidor
  PORT: process.env.PORT || 3000,

  // Configurações do jogo
  GAME: {
    // Número máximo de jogadores por mesa
    MAX_PLAYERS_PER_TABLE: 4,

    // Número mínimo de jogadores para iniciar um jogo
    MIN_PLAYERS_TO_START: 2,

    // Número padrão de rodadas
    DEFAULT_ROUNDS: 5,

    // Tempo limite padrão para jogadas (em segundos)
    DEFAULT_TURN_TIMEOUT: 30,
  },

  // Configurações de rede
  NETWORK: {
    // Intervalo de ping para manter conexões ativas (em ms)
    PING_INTERVAL: 30000,

    // Tempo limite para considerar uma conexão inativa (em ms)
    CONNECTION_TIMEOUT: 60000,
  },
}

// Script de depuração para monitorar a comunicação entre cliente e servidor

;(() => {
    console.log("Script de depuração de comunicação carregado")
  
    // Verificar se WebSocketClient está disponível
    if (!window.WebSocketClient) {
      console.error("WebSocketClient não está disponível")
      return
    }
  
    // Monitorar eventos de WebSocket
    const originalAddEventListener = window.WebSocketClient.addEventListener
    window.WebSocketClient.addEventListener = function (event, callback) {
      const wrappedCallback = (data) => {
        console.log(`[WebSocket] Evento recebido: ${event}`, data)
        return callback(data)
      }
      return originalAddEventListener.call(this, event, wrappedCallback)
    }
  
    // Monitorar envio de mensagens
    const originalSend = window.WebSocketClient.send
    window.WebSocketClient.send = function (event, data) {
      console.log(`[WebSocket] Enviando evento: ${event}`, data)
      return originalSend.call(this, event, data)
    }
  
    // Adicionar botão de diagnóstico
    document.addEventListener("DOMContentLoaded", () => {
      const debugBtn = document.createElement("button")
      debugBtn.textContent = "Diagnóstico de Comunicação"
      debugBtn.style.position = "fixed"
      debugBtn.style.bottom = "50px"
      debugBtn.style.right = "10px"
      debugBtn.style.zIndex = "9999"
      debugBtn.style.padding = "10px"
      debugBtn.style.backgroundColor = "#ff9800"
      debugBtn.style.color = "#ffffff"
      debugBtn.style.border = "none"
      debugBtn.style.borderRadius = "5px"
      debugBtn.style.cursor = "pointer"
  
      debugBtn.addEventListener("click", () => {
        const user = window.Auth ? window.Auth.getCurrentUser() : null
        const connectionStatus =
          window.WebSocketClient && window.WebSocketClient.getConnectionStatus
            ? window.WebSocketClient.getConnectionStatus()
            : "unknown"
  
        // Obter informações da mesa atual
        const urlParams = new URLSearchParams(window.location.search)
        const tableId = urlParams.get("table")
  
        // Obter dados da mesa do localStorage e sessionStorage
        const localTables = JSON.parse(localStorage.getItem("blackjack_tables") || "[]")
        const sharedTables = JSON.parse(sessionStorage.getItem("shared_blackjack_tables") || "[]")
  
        // Encontrar a mesa atual
        const localTable = localTables.find((t) => t.id === tableId)
        const sharedTable = sharedTables.find((t) => t.id === tableId)
  
        console.group("Diagnóstico de Comunicação")
        console.log("Usuário atual:", user)
        console.log("Status da conexão:", connectionStatus)
        console.log("ID da mesa atual:", tableId)
        console.log("Mesa local:", localTable)
        console.log("Mesa compartilhada:", sharedTable)
  
        // Verificar diferenças entre as mesas
        if (localTable && sharedTable) {
          console.log("Jogadores na mesa local:", localTable.players.length)
          console.log("Jogadores na mesa compartilhada:", sharedTable.players.length)
  
          // Comparar jogadores
          const localPlayerIds = localTable.players.map((p) => p.id).sort()
          const sharedPlayerIds = sharedTable.players.map((p) => p.id).sort()
  
          console.log("IDs de jogadores na mesa local:", localPlayerIds)
          console.log("IDs de jogadores na mesa compartilhada:", sharedPlayerIds)
  
          // Verificar se há diferenças
          const missingInLocal = sharedPlayerIds.filter((id) => !localPlayerIds.includes(id))
          const missingInShared = localPlayerIds.filter((id) => !sharedPlayerIds.includes(id))
  
          if (missingInLocal.length > 0) {
            console.warn("Jogadores presentes na mesa compartilhada mas ausentes na mesa local:", missingInLocal)
          }
  
          if (missingInShared.length > 0) {
            console.warn("Jogadores presentes na mesa local mas ausentes na mesa compartilhada:", missingInShared)
          }
        }
  
        // Solicitar atualização das mesas
        if (window.WebSocketClient && window.WebSocketClient.send) {
          console.log("Solicitando atualização das mesas...")
          window.WebSocketClient.send("getTables")
        }
        console.groupEnd()
  
        // Exibir alerta com resumo
        const isHost = localTable && user && localTable.host && localTable.host.id === user.id
        const playerCount = localTable ? localTable.players.length : 0
  
        alert(
          `Diagnóstico de comunicação executado.\n\n` +
            `Usuário: ${user ? user.username : "Não autenticado"}\n` +
            `Status da conexão: ${connectionStatus}\n` +
            `Mesa: ${tableId || "N/A"}\n` +
            `Você é o host: ${isHost ? "Sim" : "Não"}\n` +
            `Jogadores na mesa: ${playerCount}\n\n` +
            `Verifique o console para detalhes completos.`,
        )
      })
  
      document.body.appendChild(debugBtn)
  
      // Adicionar botão de forçar atualização
      const forceUpdateBtn = document.createElement("button")
      forceUpdateBtn.textContent = "Forçar Atualização"
      forceUpdateBtn.style.position = "fixed"
      forceUpdateBtn.style.bottom = "100px"
      forceUpdateBtn.style.right = "10px"
      forceUpdateBtn.style.zIndex = "9999"
      forceUpdateBtn.style.padding = "10px"
      forceUpdateBtn.style.backgroundColor = "#4caf50"
      forceUpdateBtn.style.color = "#ffffff"
      forceUpdateBtn.style.border = "none"
      forceUpdateBtn.style.borderRadius = "5px"
      forceUpdateBtn.style.cursor = "pointer"
  
      forceUpdateBtn.addEventListener("click", () => {
        // Forçar atualização das mesas
        if (window.WebSocketClient && window.WebSocketClient.send) {
          window.WebSocketClient.send("getTables")
          alert("Solicitação de atualização enviada ao servidor.")
        } else {
          alert("WebSocketClient não está disponível.")
        }
      })
  
      document.body.appendChild(forceUpdateBtn)
    })
  })()
  
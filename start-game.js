const { exec } = require("child_process")
const readline = require("readline")
const ip = require("ip")
const os = require("os")
const open = require("open")

// Criar interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Obter interfaces de rede disponíveis
const networkInterfaces = os.networkInterfaces()
const availableInterfaces = []

// Filtrar interfaces de rede válidas
Object.keys(networkInterfaces).forEach((ifName) => {
  networkInterfaces[ifName].forEach((iface) => {
    // Ignorar interfaces de loopback e IPv6
    if (iface.family === "IPv4" && !iface.internal) {
      availableInterfaces.push({
        name: ifName,
        address: iface.address,
      })
    }
  })
})

console.log("=== BlackjackPro - Inicialização do Servidor ===\n")

if (availableInterfaces.length === 0) {
  console.log("Nenhuma interface de rede encontrada. O jogo será executado apenas localmente.")
  startServer("localhost")
} else if (availableInterfaces.length === 1) {
  console.log(`Interface de rede encontrada: ${availableInterfaces[0].name} (${availableInterfaces[0].address})`)
  startServer(availableInterfaces[0].address)
} else {
  console.log("Múltiplas interfaces de rede encontradas:")
  availableInterfaces.forEach((iface, index) => {
    console.log(`${index + 1}. ${iface.name} (${iface.address})`)
  })

  rl.question("\nEscolha a interface de rede (número): ", (answer) => {
    const index = Number.parseInt(answer) - 1
    if (index >= 0 && index < availableInterfaces.length) {
      startServer(availableInterfaces[index].address)
    } else {
      console.log("Opção inválida. Usando o endereço IP padrão.")
      startServer(ip.address())
    }
  })
}

function startServer(ipAddress) {
  console.log(`\nIniciando servidor BlackjackPro em ${ipAddress}:3000...`)

  // Iniciar o servidor
  const server = exec("node server.js")

  server.stdout.on("data", (data) => {
    console.log(data.toString().trim())
  })

  server.stderr.on("data", (data) => {
    console.error(data.toString().trim())
  })

  // Abrir o navegador após 2 segundos
  setTimeout(() => {
    console.log("\nAbrindo o jogo no navegador...")
    open(`http://localhost:3000`)

    console.log("\nCompartilhe o seguinte endereço com outros jogadores na sua rede:")
    console.log(`http://${ipAddress}:3000`)

    console.log("\nPressione Ctrl+C para encerrar o servidor.")
  }, 2000)
}

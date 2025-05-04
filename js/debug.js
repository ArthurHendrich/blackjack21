// Debug script to help diagnose issues
console.log("Debug script loaded")

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, running diagnostics...")

  // Check for missing resources
  const checkResources = () => {
    const resources = [
      { type: "script", path: "js/auth.js" },
      { type: "script", path: "js/cards.js" },
      { type: "script", path: "js/card-sprites.js" },
      { type: "script", path: "js/ui.js" },
      { type: "script", path: "js/game.js" },
      { type: "style", path: "css/cards.css" },
      { type: "style", path: "css/main.css" },
      { type: "image", path: "assets/cards/back.png" },
    ]

    console.log("Checking resources...")

    resources.forEach((resource) => {
      const element =
        resource.type === "script"
          ? document.querySelector(`script[src="${resource.path}"]`)
          : resource.type === "style"
            ? document.querySelector(`link[href="${resource.path}"]`)
            : null

      if (resource.type === "image") {
        const img = new Image()
        img.onload = () => console.log(`✅ Image ${resource.path} loaded successfully`)
        img.onerror = () => console.error(`❌ Image ${resource.path} failed to load`)
        img.src = resource.path
      } else {
        console.log(`${element ? "✅" : "❌"} ${resource.type} ${resource.path} ${element ? "found" : "not found"}`)
      }
    })

    // Check global objects
    console.log("Checking global objects...")
    console.log("Auth:", window.Auth ? "✅ Available" : "❌ Not available")
    console.log("Cards:", window.Cards ? "✅ Available" : "❌ Not available")
    console.log("CardSprites:", window.CardSprites ? "✅ Available" : "❌ Not available")
    console.log("UI:", window.UI ? "✅ Available" : "❌ Not available")
    console.log("Game:", window.Game ? "✅ Available" : "❌ Not available")

    // Check localStorage
    console.log("Checking localStorage...")
    console.log("blackjack_current_user:", localStorage.getItem("blackjack_current_user"))
    console.log("blackjack_users:", localStorage.getItem("blackjack_users"))
    console.log("blackjack_tables:", localStorage.getItem("blackjack_tables"))
    console.log("shared_blackjack_tables:", sessionStorage.getItem("shared_blackjack_tables"))
  }

  // Add a debug button
  const debugBtn = document.createElement("button")
  debugBtn.textContent = "Run Diagnostics"
  debugBtn.style.position = "fixed"
  debugBtn.style.bottom = "10px"
  debugBtn.style.right = "10px"
  debugBtn.style.zIndex = "9999"
  debugBtn.style.padding = "10px"
  debugBtn.style.backgroundColor = "#4caf50"
  debugBtn.style.color = "#ffffff"
  debugBtn.style.border = "none"
  debugBtn.style.borderRadius = "5px"
  debugBtn.style.cursor = "pointer"

  debugBtn.addEventListener("click", checkResources)
  document.body.appendChild(debugBtn)

  // Run initial check
  setTimeout(checkResources, 1000)
})

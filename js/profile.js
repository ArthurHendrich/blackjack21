// Profile page functionality

document.addEventListener("DOMContentLoaded", () => {
  // Import Auth (assuming it's in a separate file)
  // If Auth is not in a separate file, define it here.
  // Example:
  const Auth = window.Auth // Assuming Auth is a global object

  // DOM elements
  const profileUsername = document.getElementById("profile-username")
  const profileJoinDate = document.getElementById("profile-join-date")
  const profileAvatarImg = document.getElementById("profile-avatar-img")
  const changeAvatarBtn = document.getElementById("change-avatar-btn")
  const gamesPlayed = document.getElementById("games-played")
  const gamesWon = document.getElementById("games-won")
  const winPercentage = document.getElementById("win-percentage")
  const blackjacks = document.getElementById("blackjacks")
  const gameHistory = document.getElementById("game-history")
  const achievementsGrid = document.getElementById("achievements-grid")
  const settingsForm = document.getElementById("settings-form")
  const settingsEmail = document.getElementById("settings-email")

  // Avatar modal elements
  const avatarModal = document.getElementById("avatar-modal")
  const avatarGrid = document.getElementById("avatar-grid")
  const saveAvatarBtn = document.getElementById("save-avatar-btn")
  const closeModal = document.querySelector("#avatar-modal .close-modal")

  // Variables
  let selectedAvatar = null

  // Initialize profile
  const initProfile = () => {
    const user = Auth.getCurrentUser()

    if (!user) {
      window.location.href = "index.html"
      return
    }

    // Set profile info
    profileUsername.textContent = user.username

    const joinDate = new Date(user.createdAt)
    profileJoinDate.textContent = joinDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Set avatar
    if (user.avatar) {
      profileAvatarImg.src = user.avatar
    }

    // Set stats
    gamesPlayed.textContent = user.stats?.gamesPlayed || 0
    gamesWon.textContent = user.stats?.gamesWon || 0

    const winRate = user.stats?.gamesPlayed > 0 ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) : 0
    winPercentage.textContent = `${winRate}%`

    blackjacks.textContent = user.stats?.blackjacks || 0

    // Set email in settings
    if (user.email) {
      settingsEmail.value = user.email
    }

    // Load game history
    loadGameHistory()

    // Load achievements
    loadAchievements()
  }

  // Load game history
  const loadGameHistory = () => {
    const user = Auth.getCurrentUser()

    if (!user || !user.gameHistory) {
      gameHistory.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No game history available</td>
        </tr>
      `
      return
    }

    // Sort history by date (newest first)
    const sortedHistory = [...user.gameHistory].sort((a, b) => {
      return new Date(b.date) - new Date(a.date)
    })

    // Limit to last 10 games
    const recentHistory = sortedHistory.slice(0, 10)

    if (recentHistory.length === 0) {
      gameHistory.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No game history available</td>
        </tr>
      `
      return
    }

    // Render history
    gameHistory.innerHTML = ""

    recentHistory.forEach((game) => {
      const row = document.createElement("tr")

      const date = new Date(game.date)
      const dateString = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })

      const resultClass = game.result === "win" ? "result-win" : "result-loss"

      row.innerHTML = `
        <td>${dateString}</td>
        <td>${game.tableName}</td>
        <td>${game.players.join(", ")}</td>
        <td class="${resultClass}">${game.result === "win" ? "Win" : "Loss"}</td>
        <td>${game.score}</td>
      `

      gameHistory.appendChild(row)
    })
  }

  // Load achievements
  const loadAchievements = () => {
    const user = Auth.getCurrentUser()

    // Define all possible achievements
    const allAchievements = [
      {
        id: "first_game",
        name: "First Steps",
        description: "Play your first game of Blackjack",
        icon: "🎮",
      },
      {
        id: "first_win",
        name: "Beginner's Luck",
        description: "Win your first game",
        icon: "🍀",
      },
      {
        id: "five_games",
        name: "Getting Started",
        description: "Play 5 games of Blackjack",
        icon: "🃏",
      },
      {
        id: "ten_wins",
        name: "On a Roll",
        description: "Win 10 games",
        icon: "🏆",
      },
      {
        id: "first_blackjack",
        name: "Perfect Hand",
        description: "Get your first Blackjack",
        icon: "🎯",
      },
      {
        id: "five_blackjacks",
        name: "Blackjack Master",
        description: "Get 5 Blackjacks",
        icon: "👑",
      },
      {
        id: "win_streak_3",
        name: "Hot Streak",
        description: "Win 3 games in a row",
        icon: "🔥",
      },
      {
        id: "high_score_100",
        name: "High Roller",
        description: "Score 100 points in a single game",
        icon: "💰",
      },
    ]

    // Get user's achievements
    const userAchievements = user.achievements || []

    // Render achievements
    achievementsGrid.innerHTML = ""

    allAchievements.forEach((achievement) => {
      const userAchievement = userAchievements.find((a) => a.id === achievement.id)
      const isUnlocked = !!userAchievement

      const achievementDiv = document.createElement("div")
      achievementDiv.className = `achievement ${isUnlocked ? "" : "locked"}`

      let dateString = ""
      if (isUnlocked && userAchievement.date) {
        const date = new Date(userAchievement.date)
        dateString = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      }

      achievementDiv.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
        ${isUnlocked ? `<div class="achievement-date">Unlocked: ${dateString}</div>` : ""}
        ${!isUnlocked ? '<div class="achievement-lock">🔒</div>' : ""}
      `

      achievementsGrid.appendChild(achievementDiv)
    })
  }

  // Open avatar modal
  const openAvatarModal = () => {
    // Generate avatar options
    avatarGrid.innerHTML = ""

    // Add default avatar
    const defaultAvatar = document.createElement("img")
    defaultAvatar.src = "assets/avatar-placeholder.png"
    defaultAvatar.alt = "Default Avatar"
    defaultAvatar.className = "avatar-option"
    defaultAvatar.dataset.avatar = "assets/avatar-placeholder.png"
    avatarGrid.appendChild(defaultAvatar)

    // Add other avatar options
    for (let i = 1; i <= 12; i++) {
      const avatar = document.createElement("img")
      avatar.src = `assets/avatars/avatar-${i}.png`
      avatar.alt = `Avatar ${i}`
      avatar.className = "avatar-option"
      avatar.dataset.avatar = `assets/avatars/avatar-${i}.png`
      avatarGrid.appendChild(avatar)
    }

    // Set current avatar as selected
    const currentAvatar = Auth.getCurrentUser().avatar || "assets/avatar-placeholder.png"
    const avatarOptions = avatarGrid.querySelectorAll(".avatar-option")

    avatarOptions.forEach((option) => {
      if (option.dataset.avatar === currentAvatar) {
        option.classList.add("selected")
        selectedAvatar = currentAvatar
      }

      // Add click event
      option.addEventListener("click", () => {
        avatarOptions.forEach((opt) => opt.classList.remove("selected"))
        option.classList.add("selected")
        selectedAvatar = option.dataset.avatar
      })
    })

    // Show modal
    avatarModal.classList.add("active")
  }

  // Close avatar modal
  const closeAvatarModal = () => {
    avatarModal.classList.remove("active")
  }

  // Save avatar
  const saveAvatar = () => {
    if (selectedAvatar) {
      Auth.updateUser({ avatar: selectedAvatar })
        .then((user) => {
          profileAvatarImg.src = user.avatar
          closeAvatarModal()
        })
        .catch((error) => {
          alert(error.message)
        })
    }
  }

  // Handle settings form submit
  const handleSettingsSubmit = (e) => {
    e.preventDefault()

    const email = settingsEmail.value
    const currentPassword = document.getElementById("settings-current-password").value
    const newPassword = document.getElementById("settings-new-password").value
    const confirmPassword = document.getElementById("settings-confirm-password").value

    // Validate passwords
    if (newPassword && newPassword !== confirmPassword) {
      alert("New passwords do not match")
      return
    }

    // Update user data
    const updateData = { email }

    if (newPassword && currentPassword) {
      updateData.currentPassword = currentPassword
      updateData.newPassword = newPassword
    }

    Auth.updateUser(updateData)
      .then(() => {
        alert("Settings updated successfully")
        document.getElementById("settings-current-password").value = ""
        document.getElementById("settings-new-password").value = ""
        document.getElementById("settings-confirm-password").value = ""
      })
      .catch((error) => {
        alert(error.message)
      })
  }

  // Set up event listeners
  const setupEventListeners = () => {
    // Change avatar button
    changeAvatarBtn.addEventListener("click", openAvatarModal)

    // Close avatar modal
    closeModal.addEventListener("click", closeAvatarModal)

    // Save avatar button
    saveAvatarBtn.addEventListener("click", saveAvatar)

    // Settings form
    settingsForm.addEventListener("submit", handleSettingsSubmit)

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === avatarModal) {
        closeAvatarModal()
      }
    })
  }

  // Initialize
  const init = () => {
    setupEventListeners()
    initProfile()
  }

  // Start the app
  init()
})

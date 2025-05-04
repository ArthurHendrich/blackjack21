// Animations module for card dealing and game transitions

const Animations = (() => {
  // Animation durations
  const DURATIONS = {
    DEAL: 500,
    FLIP: 500,
    MOVE: 300,
    FADE: 300,
  }

  // Deal card animation
  const dealCard = (cardElement, fromElement, toElement, delay = 0, faceDown = false) => {
    return new Promise((resolve) => {
      // Get positions
      const fromRect = fromElement.getBoundingClientRect()
      const toRect = toElement.getBoundingClientRect()

      // Set initial position
      cardElement.style.position = "absolute"
      cardElement.style.top = `${fromRect.top}px`
      cardElement.style.left = `${fromRect.left}px`
      cardElement.style.zIndex = "1000"
      cardElement.style.transform = "scale(0.8)"
      cardElement.style.opacity = "0"

      // Force reflow
      void cardElement.offsetWidth

      // Add transition
      cardElement.style.transition = `all ${DURATIONS.DEAL}ms ease-out`

      // Start animation after delay
      setTimeout(() => {
        cardElement.style.top = `${toRect.top}px`
        cardElement.style.left = `${toRect.left}px`
        cardElement.style.transform = "scale(1)"
        cardElement.style.opacity = "1"

        // Reset after animation
        setTimeout(() => {
          cardElement.style.position = ""
          cardElement.style.top = ""
          cardElement.style.left = ""
          cardElement.style.zIndex = ""
          cardElement.style.transition = ""

          // If face down, add back class
          if (faceDown) {
            cardElement.classList.add("back")
          }

          resolve()
        }, DURATIONS.DEAL)
      }, delay)
    })
  }

  // Flip card animation
  const flipCard = (cardElement, toFaceUp = true) => {
    return new Promise((resolve) => {
      // Add flip class
      cardElement.classList.add("flipping")

      // Start animation
      cardElement.style.transform = "rotateY(0deg)"
      cardElement.style.transition = `transform ${DURATIONS.FLIP / 2}ms ease-out`

      // Force reflow
      void cardElement.offsetWidth

      // First half of flip
      cardElement.style.transform = "rotateY(90deg)"

      // At halfway point, change card face
      setTimeout(() => {
        if (toFaceUp) {
          cardElement.classList.remove("back")
        } else {
          cardElement.classList.add("back")
        }

        // Second half of flip
        cardElement.style.transform = "rotateY(180deg)"

        // Reset after animation
        setTimeout(() => {
          cardElement.classList.remove("flipping")
          cardElement.style.transform = ""
          cardElement.style.transition = ""
          resolve()
        }, DURATIONS.FLIP / 2)
      }, DURATIONS.FLIP / 2)
    })
  }

  // Move card animation
  const moveCard = (cardElement, toElement) => {
    return new Promise((resolve) => {
      // Get positions
      const cardRect = cardElement.getBoundingClientRect()
      const toRect = toElement.getBoundingClientRect()

      // Calculate difference
      const diffX = toRect.left - cardRect.left
      const diffY = toRect.top - cardRect.top

      // Set transition
      cardElement.style.transition = `transform ${DURATIONS.MOVE}ms ease-out`

      // Start animation
      cardElement.style.transform = `translate(${diffX}px, ${diffY}px)`

      // Reset after animation
      setTimeout(() => {
        cardElement.style.transform = ""
        cardElement.style.transition = ""

        // Move card to new parent
        toElement.appendChild(cardElement)

        resolve()
      }, DURATIONS.MOVE)
    })
  }

  // Fade in animation
  const fadeIn = (element, delay = 0) => {
    return new Promise((resolve) => {
      element.style.opacity = "0"

      // Force reflow
      void element.offsetWidth

      // Add transition
      element.style.transition = `opacity ${DURATIONS.FADE}ms ease-out`

      // Start animation after delay
      setTimeout(() => {
        element.style.opacity = "1"

        // Reset after animation
        setTimeout(() => {
          element.style.transition = ""
          resolve()
        }, DURATIONS.FADE)
      }, delay)
    })
  }

  // Fade out animation
  const fadeOut = (element, delay = 0) => {
    return new Promise((resolve) => {
      element.style.opacity = "1"

      // Force reflow
      void element.offsetWidth

      // Add transition
      element.style.transition = `opacity ${DURATIONS.FADE}ms ease-out`

      // Start animation after delay
      setTimeout(() => {
        element.style.opacity = "0"

        // Reset after animation
        setTimeout(() => {
          element.style.transition = ""
          resolve()
        }, DURATIONS.FADE)
      }, delay)
    })
  }

  // Shake animation (for errors)
  const shake = (element) => {
    return new Promise((resolve) => {
      element.classList.add("shake")

      setTimeout(() => {
        element.classList.remove("shake")
        resolve()
      }, 500)
    })
  }

  // Pulse animation (for highlights)
  const pulse = (element) => {
    return new Promise((resolve) => {
      element.classList.add("pulse")

      setTimeout(() => {
        element.classList.remove("pulse")
        resolve()
      }, 500)
    })
  }

  // Animate timer
  const animateTimer = (timerBar, duration) => {
    // Reset timer bar
    timerBar.style.transition = "none"
    timerBar.style.width = "100%"
    timerBar.classList.remove("warning", "danger")

    // Force reflow
    void timerBar.offsetWidth

    // Start animation
    timerBar.style.transition = `width ${duration}ms linear`
    timerBar.style.width = "0%"

    // Add warning class at 50%
    setTimeout(() => {
      timerBar.classList.add("warning")
    }, duration * 0.5)

    // Add danger class at 75%
    setTimeout(() => {
      timerBar.classList.add("danger")
    }, duration * 0.75)
  }

  // Deal initial cards animation
  const dealInitialCards = async (deckElement, playerElements, dealerElement) => {
    // Create temporary card elements
    const tempCards = []

    // Deal first card to each player
    for (let i = 0; i < playerElements.length; i++) {
      const card = document.createElement("div")
      card.className = "card"
      document.body.appendChild(card)
      tempCards.push(card)

      await dealCard(card, deckElement, playerElements[i], i * 200)
    }

    // Deal first card to dealer
    const dealerCard1 = document.createElement("div")
    dealerCard1.className = "card"
    document.body.appendChild(dealerCard1)
    tempCards.push(dealerCard1)

    await dealCard(dealerCard1, deckElement, dealerElement, playerElements.length * 200)

    // Deal second card to each player
    for (let i = 0; i < playerElements.length; i++) {
      const card = document.createElement("div")
      card.className = "card"
      document.body.appendChild(card)
      tempCards.push(card)

      await dealCard(card, deckElement, playerElements[i], (playerElements.length + 1 + i) * 200)
    }

    // Deal second card to dealer (face down)
    const dealerCard2 = document.createElement("div")
    dealerCard2.className = "card"
    document.body.appendChild(dealerCard2)
    tempCards.push(dealerCard2)

    await dealCard(dealerCard2, deckElement, dealerElement, (playerElements.length * 2 + 1) * 200, true)

    // Remove temporary cards
    tempCards.forEach((card) => card.remove())

    return true
  }

  // Public API
  return {
    dealCard,
    flipCard,
    moveCard,
    fadeIn,
    fadeOut,
    shake,
    pulse,
    animateTimer,
    dealInitialCards,
    DURATIONS,
  }
})()

// Export for use in other modules
window.Animations = Animations

/**
 * Card handling using sprite sheets
 */
const CardSprites = (() => {
  // Card dimensions for each size
  const CARD_DIMENSIONS = {
    small: { width: 24, height: 40, url: "assets/cards-small.png" },
    medium: { width: 45, height: 75, url: "assets/cards-medium.png" },
    large: { width: 75, height: 125, url: "assets/cards-large.png" },
  }

  // Suit constants
  const SUITS = {
    HEARTS: 0,
    DIAMONDS: 1,
    CLUBS: 2,
    SPADES: 3,
  }

  // Rank constants (Ace is 14, Jack is 11, Queen is 12, King is 13)
  const RANKS = {
    ACE: 14,
    JACK: 11,
    QUEEN: 12,
    KING: 13,
  }

  /**
   * Set the background position for a card element
   * @param {HTMLElement} cardElement - The card DOM element
   * @param {number} rank - Card rank (1-13, where 1=Ace, 11=Jack, 12=Queen, 13=King)
   * @param {number} suit - Card suit (0=Hearts, 1=Diamonds, 2=Clubs, 3=Spades)
   */
  function setCardSprite(cardElement, rank, suit) {
    // Determine card size
    let size = "large" // Default size
    if (cardElement.classList.contains("small")) {
      size = "small"
    } else if (cardElement.classList.contains("medium")) {
      size = "medium"
    }

    const { width, height } = CARD_DIMENSIONS[size]

    // Calculate background position
    let x = 0
    let y = 0

    // Position based on suit
    if (suit === SUITS.HEARTS) {
      // Hearts are in the first row, starting from the second column
      x = -width // Skip the card back
    } else if (suit === SUITS.DIAMONDS) {
      // Diamonds alternate with hearts in the first row
      x = -width // Skip the card back
    } else if (suit === SUITS.CLUBS) {
      // Clubs are in the second row, starting from the second column
      x = -width // Skip the card back
      y = -height
    } else if (suit === SUITS.SPADES) {
      // Spades alternate with clubs in the second row
      x = -width // Skip the card back
      y = -height
    }

    // Adjust for rank
    // In the sprite sheet, each rank has two cards (one for each color of the suit)
    // So we need to skip 2 card widths for each rank
    x -= (rank - 1) * 2 * width

    // Adjust for red suits (hearts/diamonds) vs black suits (clubs/spades)
    if (suit === SUITS.DIAMONDS || suit === SUITS.SPADES) {
      x -= width // Move one more card to the right for the second suit of each color
    }

    // Set the background position
    cardElement.style.backgroundPosition = `${x}px ${y}px`
  }

  /**
   * Create a new card element
   * @param {number} rank - Card rank (1-13)
   * @param {number} suit - Card suit (0-3)
   * @param {string} size - Card size ('small', 'medium', 'large')
   * @returns {HTMLElement} - The card DOM element
   */
  function createCardElement(rank, suit, size = "large") {
    const cardElement = document.createElement("div")
    cardElement.className = `card ${size}`
    cardElement.dataset.rank = rank
    cardElement.dataset.suit = suit

    // Set the card sprite
    setCardSprite(cardElement, rank, suit)

    return cardElement
  }

  /**
   * Create a card back element
   * @param {string} size - Card size ('small', 'medium', 'large')
   * @returns {HTMLElement} - The card back DOM element
   */
  function createCardBackElement(size = "large") {
    const cardElement = document.createElement("div")
    cardElement.className = `card back ${size}`
    return cardElement
  }

  /**
   * Get the value of a card for Blackjack
   * @param {number} rank - Card rank (1-13)
   * @returns {number} - Card value in Blackjack
   */
  function getCardValue(rank) {
    if (rank === RANKS.ACE) {
      return 11 // Ace is 11 by default, can be 1 if needed
    } else if (rank >= 10) {
      return 10 // Face cards are worth 10
    } else {
      return rank // Number cards are worth their rank
    }
  }

  /**
   * Get the name of a card
   * @param {number} rank - Card rank (1-13)
   * @param {number} suit - Card suit (0-3)
   * @returns {string} - Card name (e.g., "Ace of Hearts")
   */
  function getCardName(rank, suit) {
    const rankNames = {
      1: "Ace",
      2: "2",
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7",
      8: "8",
      9: "9",
      10: "10",
      11: "Jack",
      12: "Queen",
      13: "King",
    }

    const suitNames = {
      0: "Hearts",
      1: "Diamonds",
      2: "Clubs",
      3: "Spades",
    }

    return `${rankNames[rank]} of ${suitNames[suit]}`
  }

  /**
   * Create a complete deck of cards
   * @returns {Array} - Array of card objects with rank and suit
   */
  function createDeck() {
    const deck = []

    for (let suit = 0; suit < 4; suit++) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({
          rank,
          suit,
          value: getCardValue(rank),
          name: getCardName(rank, suit),
        })
      }
    }

    return deck
  }

  /**
   * Shuffle a deck of cards using the Fisher-Yates algorithm
   * @param {Array} deck - Array of card objects
   * @returns {Array} - Shuffled deck
   */
  function shuffleDeck(deck) {
    const shuffled = [...deck]

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
  }

  // Public API
  return {
    SUITS,
    RANKS,
    setCardSprite,
    createCardElement,
    createCardBackElement,
    getCardValue,
    getCardName,
    createDeck,
    shuffleDeck,
  }
})()

// Make it available globally
window.CardSprites = CardSprites

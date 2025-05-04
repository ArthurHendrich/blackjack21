/**
 * Card handling using individual card images
 */
// Check if CardSprites already exists to avoid redefinition
if (!window.CardSprites) {
  const CardSprites = (() => {
    // Card dimensions for each size
    const CARD_DIMENSIONS = {
      small: { width: 24, height: 40 },
      medium: { width: 45, height: 75 },
      large: { width: 75, height: 125 },
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

    // Get suit name from suit index
    function getSuitName(suit) {
      switch (suit) {
        case SUITS.HEARTS:
          return "hearts"
        case SUITS.DIAMONDS:
          return "diamonds"
        case SUITS.CLUBS:
          return "clubs"
        case SUITS.SPADES:
          return "spades"
        default:
          return ""
      }
    }

    // Get suit symbol from suit index
    function getSuitSymbol(suit) {
      switch (suit) {
        case SUITS.HEARTS:
          return "♥"
        case SUITS.DIAMONDS:
          return "♦"
        case SUITS.CLUBS:
          return "♣"
        case SUITS.SPADES:
          return "♠"
        default:
          return ""
      }
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
      cardElement.className = `card ${size} ${getSuitName(suit)}`
      cardElement.dataset.rank = rank
      cardElement.dataset.suit = suit

      // Create image element for the card
      const img = document.createElement("img")
      img.src = getCardImagePath(rank, suit)
      img.alt = getCardName(rank, suit)
      cardElement.appendChild(img)

      return cardElement
    }

    /**
     * Get the image path for a card
     * @param {number} rank - Card rank (1-13)
     * @param {number} suit - Card suit (0-3)
     * @returns {string} - Path to the card image
     */
    function getCardImagePath(rank, suit) {
      const suitChar = getSuitName(suit).charAt(0).toUpperCase()
      return `assets/cards/${rank}${suitChar}.gif`
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
        14: "Ace",
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
            imagePath: getCardImagePath(rank, suit),
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
      createCardElement,
      createCardBackElement,
      getCardValue,
      getCardName,
      createDeck,
      shuffleDeck,
      getSuitName,
      getSuitSymbol,
      getCardImagePath,
    }
  })()

  // Make it available globally
  window.CardSprites = CardSprites
}

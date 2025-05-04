// Card handling and deck management

// Check if Cards already exists to avoid redefinition
if (!window.Cards) {
  const Cards = {
    suits: ["hearts", "diamonds", "clubs", "spades"],
    values: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],

    // Create a new deck of cards
    createDeck: function () {
      const deck = []

      for (const suit of this.suits) {
        for (const value of this.values) {
          deck.push({
            suit,
            value,
            displayValue: this.getDisplayValue(value),
            suitSymbol: this.getSuitSymbol(suit),
            color: this.getSuitColor(suit),
            imagePath: `assets/cards/${value}${suit.charAt(0).toUpperCase()}.gif`,
          })
        }
      }

      return deck
    },

    // Shuffle the deck using Fisher-Yates algorithm
    shuffleDeck: (deck) => {
      const shuffled = [...deck]

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      return shuffled
    },

    // Deal a card from the deck
    dealCard: (deck) => deck.pop(),

    // Get the display value of a card
    getDisplayValue: (value) => value,

    // Get the suit symbol
    getSuitSymbol: (suit) => {
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
    },

    // Get the suit color
    getSuitColor: (suit) => (suit === "hearts" || suit === "diamonds" ? "red" : "black"),

    // Calculate the value of a hand
    calculateHandValue: (hand) => {
      let value = 0
      let aceCount = 0

      for (const card of hand) {
        const cardValue = Number.parseInt(card.value)
        if (cardValue === 14) {
          // Ás
          aceCount++
          value += 11
        } else if (cardValue >= 11) {
          // J, Q, K
          value += 10
        } else {
          value += cardValue
        }
      }

      // Adjust for aces if needed
      while (value > 21 && aceCount > 0) {
        value -= 10
        aceCount--
      }

      return value
    },

    // Check if a hand is a blackjack
    isBlackjack: function (hand) {
      return hand.length === 2 && this.calculateHandValue(hand) === 21
    },

    // Check if a hand is busted
    isBusted: function (hand) {
      return this.calculateHandValue(hand) > 21
    },
  }

  // Make Cards available globally
  window.Cards = Cards
}

const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  tableId: {
    type: String,
    required: true,
    unique: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    position: Number,
    score: { type: Number, default: 0 },
    cards: [{
      suit: String,
      value: String,
      hidden: Boolean
    }]
  }],
  dealer: {
    cards: [{
      suit: String,
      value: String,
      hidden: Boolean
    }]
  },
  currentRound: {
    type: Number,
    default: 1
  },
  totalRounds: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'finished'],
    default: 'waiting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  roundHistory: [{
    roundNumber: Number,
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scores: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      score: Number
    }]
  }]
});

module.exports = mongoose.model('Game', gameSchema); 
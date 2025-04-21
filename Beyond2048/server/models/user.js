const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
    theme: {
        type: String,
        enum: ['classic', 'dark', 'neon', 'childish'],
        default: 'classic'
    },
    gameSize: {
        type: Number,
        enum: [3, 4, 5, 6],
        default: 4
    },
    soundEffects: {
        type: Boolean,
        default: false
    },
    animations: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const gameHistorySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    score: { type: Number, required: true },
    highestTile: { type: Number, required: true },
    moves: { type: Number, default: 0 },
    result: { type: String, enum: ['WIN', 'LOSS'] },
    won: { type: Boolean, default: false },
    timePlayed: { type: Number, default: 0 }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },

    settings: {
        type: userSettingsSchema,
        default: () => ({})
    },

    bestScore: { type: Number, default: 0 },
    highestTile: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalMoves: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    minutesPlayed: { type: Number, default: 0 },

    gameHistory: [gameHistorySchema]
});

module.exports = mongoose.model('User', UserSchema);
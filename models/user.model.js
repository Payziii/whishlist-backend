import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    telegramId: {
        type: Number,
        required: true,
        unique: true
    },
    username: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    language: {
        type: String
    },
    telegramPremium: {
        type: Boolean
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    photo_url: {
        type: String
    },
    currency: {
        type: String,
        default: 'RUB'
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    giftviewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    blocked: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true })

const User = mongoose.model("User", userSchema)

export default User
import mongoose from "mongoose"

const giftSchema = new mongoose.Schema({
    owner: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    linkToGift: {
        type: String
    },
    price: {
        type: Number
    },
    isReserved: {
        type: Boolean,
        default: false
    },
    isGiven: {
        type: Boolean,
        default: false
    },
    isThanked: {
        type: Boolean,
        default: false
    },
    reservedBy: {
        type: Number
    },
    linkToImage: {
        type: String
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    donation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation'
    }
}, { timestamps: true })

giftSchema.index({ owner: 1, name: "text" });

const Gift = mongoose.model("Gift", giftSchema)

export default Gift
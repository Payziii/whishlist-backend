import mongoose from "mongoose"

const donationSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    donors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor'
    }]
}, { timestamps: true })

const Donation = mongoose.model("Donation", donationSchema)

export default Donation
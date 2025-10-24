import mongoose from "mongoose"

const donorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number
    }
}, { timestamps: true })

const Donor = mongoose.model("Donor", donorSchema)

export default Donor
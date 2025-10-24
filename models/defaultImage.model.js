import mongoose from "mongoose"

const defaultImageSchema = new mongoose.Schema({
    base64: {
        type: String,
        required: true
    }
}, { timestamps: true });

const DefaultImage=mongoose.model("DefaultImage",defaultImageSchema)

export default DefaultImage
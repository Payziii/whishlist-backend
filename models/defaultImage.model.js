import mongoose from "mongoose"

const defaultImageSchema = new mongoose.Schema({
    base64: {
        type: String,
        required: true
    },
    original: {
        type: String,
        required: true
    },
    web: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true,
        default: 'image/jpeg'
    }
}, { timestamps: true });

const DefaultImage=mongoose.model("DefaultImage",defaultImageSchema)

export default DefaultImage
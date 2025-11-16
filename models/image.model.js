import mongoose from "mongoose"

const imageSchema = new mongoose.Schema({
    base64: {
        type: String,
        required: false
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

const Image=mongoose.model("Image",imageSchema)

export default Image
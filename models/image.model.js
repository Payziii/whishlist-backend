import mongoose from "mongoose"

const imageSchema = new mongoose.Schema({
    base64: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Image=mongoose.model("Image",imageSchema)

export default Image
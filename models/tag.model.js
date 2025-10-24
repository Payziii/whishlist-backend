import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Tag name is required"],
        trim: true 
    },
    color: {
        type: String,
        required: [true, "Tag color is required"],
        trim: true,
        default: '#808080' 
    },
    background: {
        type: String,
        required: [true, "Tag bg is required"],
        trim: true,
        default: '#808080' 
    },
    owner: {
        type: Number,
        required: true,
        index: true 
    }
}, { timestamps: true });

tagSchema.index({ owner: 1, name: 1 }, { unique: true });

const Tag = mongoose.model("Tag", tagSchema);

export default Tag;
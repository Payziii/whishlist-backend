import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    }
}, { timestamps: true });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default FriendRequest;
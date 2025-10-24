import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        required: true,
        enum: [
            'FRIEND_REQUEST',
            'FRIEND_REQUEST_ACCEPTED',
            'FRIEND_REQUEST_DECLINED',

            'EVENT_INVITATION',
            'EVENT_PARTICIPANT_JOINED',
            'EVENT_PARTICIPANT_LEFT',
            'EVENT_STARTING_SOON',
            'EVENT_THANK_YOU',
            'EVENT_COMPLETED',
            'EVENT_GIFTERS_REVEALED',

            'GIFT_RESERVED',
            'GIFT_GIVEN',
            'GIFT_THANK_YOU_NOTE',
            'GIFT_FUNDRAISING_OPENED',
            'GIFT_FUNDRAISING_CLOSED'
        ]
    },
    message: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'entityModel'
    },
     entityModel: {
        type: String,
        required: true,
        enum: ['User', 'Event', 'Gift', 'FriendRequest']
    },
    isRead: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
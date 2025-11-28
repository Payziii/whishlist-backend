import mongoose from "mongoose"

const eventSchema=new mongoose.Schema({
    owner:{
        type:Number,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    image:{
        type:String
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    completionNotificationSent: {
        type: Boolean,
        default: false
    },
    startNotificationSent: {
        type: Boolean,
        default: false
    },
    gifts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gift' 
        }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }],
    isAnonymous: {
        type: Boolean,
        default: false
    },
    giftersRevealedAt: {
        type: Date,
        default: null
    },
    sendInvitations: {
        type: Boolean,
        default: false
    },
    sendAcknowledgements: {
        type: Boolean,
        default: false
    },
    acknowledgementMessage: {
        type: String,
        default: "Большое спасибо {name} за участие в событии {event}!"
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }]
},{timestamps:true})

const Event=mongoose.model("Event",eventSchema)

export default Event
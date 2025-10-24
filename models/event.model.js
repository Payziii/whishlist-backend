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
        default: "Большое спасибо {имя} за участие в событии {Событие}!"
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }]
},{timestamps:true})

const Event=mongoose.model("Event",eventSchema)

export default Event
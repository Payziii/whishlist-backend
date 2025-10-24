import mongoose from "mongoose"

const draftSchema=new mongoose.Schema({
    owner:{
        type:Number,
        required:true
    },
    name:{
        type:String
    },
    description:{
        type:String
    },
    linkToGift:{
        type:String
    },
    price:{
        type:Number
    },
    linkToImage:{
        type:String
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag' 
    }]
},{timestamps:true})

const Draft=mongoose.model("Draft",draftSchema)

export default Draft
import mongoose from "mongoose"

const connectToMongo=async()=>{
    try{
        const mongoConnection=await mongoose.connect(process.env.MONGO_PATH)
        console.log(`Mongo connected at ${mongoConnection.connection.host}`)
    }catch(error){
        console.log(error)
        process.exit(1)
    }
}

export default connectToMongo
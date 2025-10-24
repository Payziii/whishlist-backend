import express from "express"
import Image from "../models/image.model.js"
import DefaultImage from "../models/defaultImage.model.js"
import { Types } from "mongoose"
import { authMiddleware } from '../middleware/auth.middleware.js'

const router=express.Router()

router.post("/",async(req,res)=>{
    try {
        const { base64 } = req.body;

        if (!base64) {
            return res.status(400).json({ error: 'Base64 data is required' });
        }

        const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");

        const newImage = new Image({
            base64: base64Data
        });

        const savedImage = await newImage.save();
        res.status(201).json({ message: 'Image uploaded successfully', id: savedImage._id });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to upload image' });
    }
})

router.get("/:id",async(req,res)=>{
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const base64Data = image.base64;
        const buffer = Buffer.from(base64Data, 'base64');
        res.contentType('image/png');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
})

router.get("/raw/:id",async(req,res)=>{
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }
        res.status(201).json({image})
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
})
export default router
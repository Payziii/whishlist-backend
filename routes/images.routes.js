import express from "express"
import Image from "../models/image.model.js"
import DefaultImage from "../models/defaultImage.model.js"
import { Types } from "mongoose"
import { authMiddleware } from '../middleware/auth.middleware.js'

const router=express.Router()

router.post("/default",async(req,res)=>{
    try {
        const { base64 } = req.body;

        if (!base64) {
            return res.status(400).json({ error: 'Base64 data is required' });
        }

        const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");

        const newImage = new DefaultImage({
            base64: base64Data
        });

        const savedImage = await newImage.save();
        res.status(201).json({ message: 'Image uploaded successfully', id: savedImage._id });
    } catch (error) {
        console.log('Ошибка:', error)
        res.status(500).json({ error: 'Failed to upload image' });
    }
})

router.get("/default", async (req, res) => {
    try {
        const images = await DefaultImage.find({});
        const protocol = req.protocol;
        const host = req.get('host');

        const result = images.map(image => ({
            _id: image._id,
            url: `${protocol}://${host}/images/default/${image._id}`,
            base64: image.base64
        }));

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to retrieve images' });
    }
});


router.get("/default/:id",async(req,res)=>{
    try {
        const image = await DefaultImage.findById(req.params.id);
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

/**
 * @swagger
 * tags:
 *   - name: DefaultImages
 *     description: Управление изображениями по умолчанию
 *
 * components:
 *   schemas:
 *     DefaultImage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор изображения.
 *           example: 60d0fe4f5311236168a109cb
 *         base64:
 *           type: string
 *           description: Строка в формате Base64 без префикса data:image/...;base64,
 *           example: iVBORw0KGgoAAAANSUhEUgAA...
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время создания изображения.
 *           example: "2024-08-25T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время последнего обновления изображения.
 *           example: "2024-08-25T12:00:00Z"
 */

/**
 * @swagger
 * /images/default:
 *   post:
 *     summary: Загрузить изображение по Base64
 *     tags: [DefaultImages]
 *     requestBody:
 *       description: Объект с Base64 кодированием изображения без префикса данных
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base64:
 *                 type: string
 *                 description: Строка изображения в формате Base64 (без префикса data:image/...;base64,)
 *                 example: iVBORw0KGgoAAAANSUhEUgAA...
 *     responses:
 *       201:
 *         description: Изображение успешно загружено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 id:
 *                   type: string
 *                   description: ID сохраненного изображения
 *                   example: 60d0fe4f5311236168a109cb
 *       400:
 *         description: Требуется передать Base64 изображение
 *       500:
 *         description: Ошибка сервера при сохранении изображения
 *
 *   get:
 *     summary: Получить все изображения по умолчанию
 *     tags: [DefaultImages]
 *     responses:
 *       200:
 *         description: Успешное получение списка изображений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DefaultImage'
 *       500:
 *         description: Ошибка при получении изображений
 */
export default router
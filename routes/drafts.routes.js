import express from "express"
import Draft from "../models/draft.model.js"
import Tag from '../models/tag.model.js';
import User from "../models/user.model.js";
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createNotification } from '../services/notification.service.js';

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Drafts
 *   description: Управление черновиками подарков
 * 
 * components:
 *   schemas:
 *     Draft:
 *       type: object
 *       required:
 *         - owner
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор черновика.
 *           example: 60d0fe4f5311236168a109cb
 *         owner:
 *           type: integer
 *           description: Telegram ID владельца черновика.
 *           example: 123456789
 *         name:
 *           type: string
 *           description: Название черновика.
 *           example: "Книга по программированию"
 *         description:
 *           type: string
 *           description: Описание черновика.
 *           example: "Последнее издание книги 'Чистый код'."
 *         linkToGift:
 *           type: string
 *           description: Ссылка на страницу черновика в магазине.
 *           example: "https://www.example.com/clean-code"
 *         price:
 *           type: number
 *           description: Цена черновика.
 *           example: 25.99
 *         linkToImage:
 *           type: string
 *           description: Ссылка на изображение черновика.
 *           example: "https://www.example.com/images/clean-code.jpg"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             description: ID тега, который привязан к подарку.
 *           description: Массив ID тегов, привязанных к этому подарку.
 */

/**
 * @swagger
 * /drafts:
 *   get:
 *     summary: Получить список черновиков пользователя
 *     tags: [Drafts]
 *     responses:
 *       200:
 *         description: Список черновиков пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Draft'
 */

/**
 * @swagger
 * /drafts:
 *   post:
 *     summary: Создать новый черновик
 *     tags: [Drafts]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название черновика.
 *                 example: "Беспроводные наушники"
 *               description:
 *                 type: string
 *                 description: Описание или заметки к подарку.
 *                 example: "Желательно черного цвета, модель Sony WH-1000XM5"
 *               linkToGift:
 *                 type: string
 *                 description: Ссылка на страницу черновика в магазине.
 *                 example: "https://www.ozon.ru/product/naushniki-sony-wh-1000xm5-chernyy-634423456/"
 *               price:
 *                 type: number
 *                 description: Примерная цена черновика.
 *                 example: 35000
 *               linkToImage:
 *                 type: string
 *                 description: Изображение в формате Base64.
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив ID тегов, которые нужно привязать к подарку
 *                 example: ["60c72b2f9b1d8c001f8e4c6d", "60c72b3a9b1d8c001f8e4c6e"]
 *     responses:
 *       201:
 *         description: Черновик успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Draft'
 *       400:
 *         description: Некорректные данные (например, указаны чужие или несуществующие теги)
 *       500:
 *         description: Внутренняя ошибка сервера (например, при загрузке изображения)
 */

/**
 * @swagger
 * /drafts:
 *   put:
 *     summary: Обновить существующий черновик
 *     tags: [Drafts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - draftId
 *             properties:
 *               draftId:
 *                 type: string
 *                 description: ID черновика, который нужно обновить.
 *                 example: "615b1f3c3d4a5b001f8e4c7a"
 *               name:
 *                 type: string
 *                 description: Новое название черновика.
 *               description:
 *                 type: string
 *                 description: Новое описание черновика.
 *               linkToGift:
 *                 type: string
 *                 description: Новая ссылка на черновик.
 *               price:
 *                 type: number
 *                 description: Новая цена черновика.
 *               linkToImage:
 *                 type: string
 *                 description: Новое изображение в формате Base64.
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Полный новый массив ID тегов. Если передать пустой массив [], все теги будут отвязаны. Если не передавать это поле, теги не изменятся.
 *                 example: ["60c72b3a9b1d8c001f8e4c6e"]
 *     responses:
 *       200:
 *         description: Черновик успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gift'
 *       400:
 *         description: Некорректные данные (например, указаны чужие или несуществующие теги)
 *       403:
 *         description: Доступ запрещен (попытка изменить чужой черновик)
 *       404:
 *         description: Черновик с указанным ID не найден
 */

/**
 * @swagger
 * /drafts/{draftId}:
 *   get:
 *     summary: Получить черновик по ID
 *     tags: [Drafts]
 *     parameters:
 *       - in: path
 *         name: draftId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID черновика
 *     responses:
 *       200:
 *         description: Данные черновика
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Draft'
 *       404:
 *         description: Черновик не найден
 *   delete:
 *     summary: Удалить черновик
 *     tags: [Drafts]
 *     parameters:
 *       - in: path
 *         name: draftId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID черновика
 *     responses:
 *       200:
 *         description: Черновик удален
 *       403:
 *         description: Нет прав на удаление этого черновика
 *       404:
 *         description: Черновик не найден
 */

//Create gift
router.post("/", authMiddleware, async (req, res) => {

    const { tags } = req.body;
    const ownerId = req.user.telegramId;
    let validatedTagIds = [];

    if (tags && Array.isArray(tags) && tags.length > 0) {
        const userTags = await Tag.find({
            '_id': { $in: tags },
            'owner': ownerId
        }).select('_id');
        if (userTags.length !== tags.length) {
            return res.status(400).json({ message: "Invalid tags provided. One or more tags do not exist or do not belong to you." });
        }

        validatedTagIds = userTags.map(tag => tag._id);
    }
    let imageId;
    if(req.body.linkToImage && req.body.linkToImage.length > 0) {
        const response = await fetch("https://whishlist.hubforad.com/images", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ base64: req.body.linkToImage })
    });

    const responseData = await response.json();

    if (response.ok) {
        imageId = `https://whishlist.hubforad.com/images/${responseData.id}`;
    }
}
        const gift = new Draft({
            owner: req.user.telegramId,
            name: req.body.name,
            description: req.body.description,
            linkToGift: req.body.linkToGift,
            price: req.body.price,
            currency: req.body.currency || 'RUB',
            linkToImage: imageId,
            tags: validatedTagIds
        })
        try {
            const newDraft = await gift.save()
            res.json(newDraft)
        } catch (error) {
            res.json({ message: error.message })
        }

})

router.put("/", authMiddleware, async (req, res) => {
    const gift = await Draft.findById(req.body.draftId)
    if (!gift) {
        return res.status(404).json({ message: "Draft not found" })
    }
    if (gift.owner !== req.user.telegramId) {
        return res.status(403).json({ message: "Not authorized to update this gift" })
    }
    gift.name = req.body.name || gift.name
    gift.description = req.body.description || gift.description
    gift.linkToGift = req.body.linkToGift || gift.linkToGift
    gift.price = req.body.price || gift.price
    gift.currency = req.body.currency || gift.currency

    if (req.body.tags !== undefined) {
            const { tags } = req.body;
            let validatedTagIds = [];

            if (Array.isArray(tags) && tags.length > 0) {
                const userTags = await Tag.find({
                    '_id': { $in: tags },
                    'owner': req.user.telegramId
                }).select('_id');

                if (userTags.length !== tags.length) {
                    return res.status(400).json({ message: "Invalid tags provided for update. One or more tags do not exist or do not belong to you." });
                }
                validatedTagIds = userTags.map(tag => tag._id);
            }
            gift.tags = validatedTagIds;
        }

    if (req.body.linkToImage) {
        const response = await fetch("https://whishlist.hubforad.com/images", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ base64: req.body.linkToImage })
        });

        const responseData = await response.json();

        if (response.ok) {
            const imageId = responseData.id;
            gift.linkToImage = `https://whishlist.hubforad.com/images/${imageId}`;
        } else {
            return res.status(500).json({ message: "Failed to upload image" });
        }
    } else {
        gift.linkToImage = gift.linkToImage
    }
    try {
        const updatedDraft = await gift.save()
        res.json(updatedDraft)
    } catch (error) {
        res.json({ message: error.message })
    }
})

//Get gift by ID
router.get("/:draftId", async (req, res) => {
    try {
        const requesterTelegramId = req.user.telegramId;
        const ownerUser = await User.findOne({
            telegramId: requesterTelegramId
        }).select('telegramId username firstName lastName photo_url').lean();

        const draft = await Draft.findById(req.params.draftId).populate('tags');
        if (!draft) {
            return res.status(404).json({ message: "Draft not found" })
        }

        draft.ownerInfo = ownerUser ? {
            telegramId: ownerUser.telegramId,
            username: ownerUser.username,
            firstName: ownerUser.firstName,
            lastName: ownerUser.lastName,
            photo_url: ownerUser.photo_url
        } : null;
        res.json(draft)
    } catch (error) {
        res.json({ message: error.message })
    }
})

router.get("/", authMiddleware, async (req, res) => {
    try {
        const drafts = await Draft.find({ owner: req.user.telegramId }).populate('tags')
        res.json(drafts)
    } catch (error) {
        res.json({ message: error.message })
    }
})

//Delete gift
router.delete("/:draftId", authMiddleware, async (req, res) => {
    try {
        const gift = await Draft.findById(req.params.draftId)
        if (!gift) {
            return res.status(404).json({ message: "Draft not found" })
        }

        if (gift.owner !== req.user.telegramId) {
            return res.status(403).json({ message: "Not authorized to delete this draft" })
        }

        await Draft.findByIdAndDelete(req.params.draftId)
        res.json("Draft deleted")
    } catch (error) {
        res.json({ message: error.message })
    }
})

export default router;
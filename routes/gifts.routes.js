import express from "express"
import dotenv from "dotenv";
import mongoose from 'mongoose';
import Gift from "../models/gift.model.js"
import Event from "../models/event.model.js";
import Tag from '../models/tag.model.js';
import User from "../models/user.model.js";
import Donation from "../models/donation.model.js";
import Donor from "../models/donor.model.js";
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createNotification } from '../services/notification.service.js';

dotenv.config();
const router = express.Router()

const DOMAIN = process.env.DOMAIN || 'http://app:5000';

/**
 * @swagger
 * tags:
 *   name: Gifts
 *   description: Управление подарками
 * 
 * components:
 *   schemas:
 *     Gift:
 *       type: object
 *       required:
 *         - owner
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор подарка.
 *           example: 60d0fe4f5311236168a109cb
 *         owner:
 *           type: integer
 *           description: Telegram ID владельца подарка.
 *           example: 123456789
 *         name:
 *           type: string
 *           description: Название подарка.
 *           example: "Книга по программированию"
 *         description:
 *           type: string
 *           description: Описание подарка.
 *           example: "Последнее издание книги 'Чистый код'."
 *         linkToGift:
 *           type: string
 *           description: Ссылка на страницу подарка в магазине.
 *           example: "https://www.example.com/clean-code"
 *         price:
 *           type: number
 *           description: Цена подарка.
 *           example: 25.99
 *         linkToImage:
 *           type: string
 *           description: Ссылка на изображение подарка.
 *           example: "https://www.example.com/images/clean-code.jpg"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             description: ID тега, который привязан к подарку.
 *           description: Массив ID тегов, привязанных к этому подарку.
 *         isGiven:
 *           type: boolean
 *           description: Подарен ли подарок.
 *           default: false
 *           example: false
 *         isReserved:
 *           type: boolean
 *           description: Зарезервирован ли подарок.
 *           default: false
 *           example: false
 *         reservedBy:
 *           type: integer
 *           description: Telegram ID пользователя, который зарезервировал подарок.
 *           example: 987654321
 *         viewers:
 *           type: array
 *           items:
 *             type: string
 *           description: Массив ID пользователей, которые имеют доступ к просмотру подарка. Если массив пуст или поле отсутствует, подарок видят все.
 *           example: ["507f1f77bcf86cd799439012"]
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Donor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID донора
 *         user:
 *           $ref: '#/components/schemas/User'
 *         amount:
 *           type: number
 *           description: Сумма взноса
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Donation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID сбора средств
 *         author:
 *           $ref: '#/components/schemas/User'
 *         donors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Donor'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /gifts/wishlist/{telegramId}:
 *   get:
 *     summary: Получить список желаний пользователя
 *     tags: [Gifts]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Telegram ID пользователя
 *     responses:
 *       200:
 *         description: Список подарков пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Gift'
 */

/**
 * @swagger
 * /gifts/wishlist/{telegramId}/reserved:
 *   get:
 *     summary: Получить забронированные подарки пользователя
 *     tags: [Gifts]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Telegram ID пользователя
 *     responses:
 *       200:
 *         description: Список забронированных подарков
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Gift'
 */

/**
 * @swagger
 * /gifts/wishlist/{telegramId}/unreserved:
 *   get:
 *     summary: Получить незабронированные подарки пользователя
 *     tags: [Gifts]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Telegram ID пользователя
 *     responses:
 *       200:
 *         description: Список незабронированных подарков
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Gift'
 */

/**
 * @swagger
 * /gifts/reserved-by/{telegramId}:
 *   get:
 *     summary: Получить подарки, забронированные пользователем
 *     tags: [Gifts]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Telegram ID пользователя, который забронировал подарки
 *     responses:
 *       200:
 *         description: Список подарков, забронированных пользователем
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Gift'
 */

/**
 * @swagger
 * /gifts:
 *   post:
 *     summary: Создать новый подарок
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название подарка.
 *                 example: "Беспроводные наушники"
 *               description:
 *                 type: string
 *                 description: Описание или заметки к подарку.
 *                 example: "Желательно черного цвета, модель Sony WH-1000XM5"
 *               linkToGift:
 *                 type: string
 *                 description: Ссылка на страницу подарка в магазине.
 *                 example: "https://www.ozon.ru/product/naushniki-sony-wh-1000xm5-chernyy-634423456/"
 *               price:
 *                 type: number
 *                 description: Примерная цена подарка.
 *                 example: 35
 *               currency:
 *                 type: string
 *                 description: Валюта подарка
 *                 example: "EUR"
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
 *               viewers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив ID или Telegram username пользователей, которым будет разрешен просмотр подарка. Если не указан или пуст, подарок будет виден всем.
 *                 example: ["64e32c3b4f1b2c001f8e4c7b", "another_user_telegram"]
 *     responses:
 *       201:
 *         description: Подарок успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gift'
 *       400:
 *         description: Некорректные данные (например, указаны чужие или несуществующие теги)
 *       500:
 *         description: Внутренняя ошибка сервера (например, при загрузке изображения)
 */

/**
 * @swagger
 * /gifts:
 *   put:
 *     summary: Обновить существующий подарок
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - giftId
 *             properties:
 *               giftId:
 *                 type: string
 *                 description: ID подарка, который нужно обновить.
 *                 example: "615b1f3c3d4a5b001f8e4c7a"
 *               name:
 *                 type: string
 *                 description: Новое название подарка.
 *               description:
 *                 type: string
 *                 description: Новое описание подарка.
 *               linkToGift:
 *                 type: string
 *                 description: Новая ссылка на подарок.
 *               price:
 *                 type: number
 *                 description: Новая цена подарка.
 *               currency:
 *                 type: string
 *                 description: Новая валюта подарка
 *               linkToImage:
 *                 type: string
 *                 description: Новое изображение в формате Base64.
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Полный новый массив ID тегов. Если передать пустой массив [], все теги будут отвязаны. Если не передавать это поле, теги не изменятся.
 *                 example: ["60c72b3a9b1d8c001f8e4c6e"]
 *               viewers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив ID или Telegram username пользователей, которым будет разрешен просмотр подарка. Если не указан или пуст, подарок будет виден всем.
 *                 example: ["64e32c3b4f1b2c001f8e4c7b", "another_user_telegram"]
 *     responses:
 *       200:
 *         description: Подарок успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gift'
 *       400:
 *         description: Некорректные данные (например, указаны чужие или несуществующие теги)
 *       403:
 *         description: Доступ запрещен (попытка изменить чужой подарок)
 *       404:
 *         description: Подарок с указанным ID не найден
 */

/**
 * @swagger
 * /gifts/{giftId}:
 *   get:
 *     summary: Получить подарок по ID
 *     tags: [Gifts]
 *     parameters:
 *       - in: path
 *         name: giftId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID подарка
 *     responses:
 *       200:
 *         description: Данные подарка
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gift'
 *       404:
 *         description: Подарок не найден
 *
 *   patch:
 *     summary: Отметить подарок как забронированный/незабронированный
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: giftId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID подарка
 *     responses:
 *       200:
 *         description: Статус брони подарка обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gift'
 *
 *   delete:
 *     summary: Удалить подарок
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: giftId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID подарка
 *     responses:
 *       200:
 *         description: Подарок удален
 *       403:
 *         description: Нет прав на удаление этого подарка
 *       404:
 *         description: Подарок не найден
 */

/**
 * @swagger
 * /gifts/mark-given/{giftId}:
 *   patch:
 *     summary: Отметить подарок как подаренный/неподаренный
 *     tags: [Gifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: giftId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID подарка для изменения статуса 'подарен'
 *     responses:
 *       200:
 *         description: Статус 'подарен' успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gift'
 *       403:
 *         description: Пользователь не владелец подарка
 *       404:
 *         description: Подарок с таким ID не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
//Get gifts of user
router.get("/wishlist/:telegramId", authMiddleware, async (req, res) => {
    try {
        const targetTelegramId = parseInt(req.params.telegramId);
        const requesterTelegramId = req.user.telegramId;

        // Получаем текущего пользователя
        const requesterUser = await User.findOne({ telegramId: requesterTelegramId }).select('_id');

        // Получаем владельца подарков
        const ownerUser = await User.findOne({
            telegramId: targetTelegramId
        }).select('telegramId username firstName lastName photo_url').lean();

        // Находим подарки владельца
        const gifts = await Gift.find({ owner: targetTelegramId })
            .populate('tags')
            .lean();

        // Фильтруем подарки по доступу
        const accessibleGifts = gifts.filter(gift => {
            const isPublic = (targetTelegramId == requesterTelegramId) || !gift.viewers || gift.viewers.length === 0;
            if (isPublic) return true;

            const isViewer = requesterUser
                ? gift.viewers.some(viewerId => viewerId.toString() === requesterUser._id.toString())
                : false;

            return isViewer;
        });

        // Добавляем информацию о владельце в каждый подарок
        const giftsWithOwnerInfo = accessibleGifts.map(gift => ({
            ...gift,
            ownerInfo: ownerUser ? {
                telegramId: ownerUser.telegramId,
                username: ownerUser.username,
                firstName: ownerUser.firstName,
                lastName: ownerUser.lastName,
                photo_url: ownerUser.photo_url
            } : null
        }));

        res.json(giftsWithOwnerInfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Get reserved gifts of exact user
router.get("/wishlist/:telegramId/reserved", async (req, res) => {
    try {
        const targetTelegramId = parseInt(req.params.telegramId);
        const ownerUser = await User.findOne({
            telegramId: targetTelegramId
        }).select('telegramId username firstName lastName photo_url').lean();

        const gifts = await Gift.find({ owner: targetTelegramId, isReserved: true })
            .populate('tags')
            .lean();

        const giftsWithOwnerInfo = gifts.map(gift => ({
            ...gift,
            ownerInfo: ownerUser ? {
                telegramId: ownerUser.telegramId,
                username: ownerUser.username,
                firstName: ownerUser.firstName,
                lastName: ownerUser.lastName,
                photo_url: ownerUser.photo_url
            } : null
        }));
        res.json(giftsWithOwnerInfo)
    } catch (error) {
        res.json({ message: error.message })
    }
})

//Get unreserved gifts of exact user
router.get("/wishlist/:telegramId/unreserved", async (req, res) => {
    try {
        const gifts = await Gift.find({ owner: req.params.telegramId, isReserved: false })
        res.json(gifts)
    } catch (error) {
        res.json({ message: error.message })
    }
})

//Get gifts reserved by user
router.get("/reserved-by/:telegramId", async (req, res) => {
    try {
        const gifts = await Gift.find({ reservedBy: req.params.telegramId })
        res.json(gifts)
    } catch (error) {
        res.json({ message: error.message })
    }
})

//Create gift
router.post("/", authMiddleware, async (req, res) => {
    const { tags, viewers, linkToImage } = req.body;
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

    // +++ НАЧАЛО: ВАЛИДАЦИЯ VIEWERS (как у тебя было)
    let viewerObjectIds = [];
    if (viewers && Array.isArray(viewers) && viewers.length > 0) {
        const potentialObjectIds = [];
        const potentialUsernames = [];

        viewers.forEach(identifier => {
            if (mongoose.Types.ObjectId.isValid(identifier)) {
                potentialObjectIds.push(identifier);
            } else {
                potentialUsernames.push(identifier);
            }
        });

        const foundUsers = await User.find({
            $or: [
                { '_id': { $in: potentialObjectIds } },
                { 'username': { $in: potentialUsernames } }
            ]
        }).select('_id');

        if (foundUsers.length !== viewers.length) {
            return res.status(400).json({ message: "One or more specified users for viewing were not found." });
        }
        viewerObjectIds = foundUsers.map(user => user._id);
    }
    // +++ КОНЕЦ: ВАЛИДАЦИЯ VIEWERS

    let finalLinkToImage;

    if (linkToImage) {
        // Если это уже ссылка – просто сохраняем её
        if (/^https?:\/\//i.test(linkToImage)) {
            finalLinkToImage = linkToImage;
        } else {
            // Иначе считаем, что это base64 и заливаем на сервер
            const response = await fetch(`${DOMAIN}/images`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ base64: linkToImage })
            });

            const responseData = await response.json();

            if (!response.ok) {
                return res.status(500).json({ message: "Failed to upload image" });
            }

            const imageId = responseData.id;
            finalLinkToImage = `${DOMAIN}/images/${imageId}`;
        }
    }

    const gift = new Gift({
        owner: req.user.telegramId,
        name: req.body.name,
        description: req.body.description,
        linkToGift: req.body.linkToGift,
        price: req.body.price,
        currency: req.body.currency || 'RUB',
        linkToImage: finalLinkToImage, // <-- тут сохраняем либо URL, либо загруженную картинку
        tags: validatedTagIds,
        viewers: viewerObjectIds
    });

    try {
        const newGift = await gift.save();
        res.json(newGift);
    } catch (error) {
        res.json({ message: error.message });
    }
});

router.put("/", authMiddleware, async (req, res) => {
    const gift = await Gift.findById(req.body.giftId)
    if (!gift) {
        return res.status(404).json({ message: "Gift not found" })
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

    if (req.body.viewers !== undefined) {
        if (Array.isArray(req.body.viewers) && req.body.viewers.length > 0) {
            const foundUsers = await User.find({ '_id': { $in: req.body.viewers } }).select('_id');
            if (foundUsers.length !== req.body.viewers.length) {
                return res.status(400).json({ message: "One or more users for viewing were not found." });
            }
        }
        gift.viewers = req.body.viewers;
    }

    if (req.body.linkToImage !== undefined) {
        const linkToImage = req.body.linkToImage;

        if (!linkToImage) {
            // Если явно передали пустое значение – можем очистить картинку (если нужно)
            gift.linkToImage = undefined;
        } else if (/^https?:\/\//i.test(linkToImage)) {
            // Если это уже ссылка – просто сохраняем её
            gift.linkToImage = linkToImage;
        } else {
            // Иначе считаем, что это base64 и заливаем на сервер
            const response = await fetch(`${DOMAIN}/images`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ base64: linkToImage })
            });

            const responseData = await response.json();

            if (!response.ok) {
                return res.status(500).json({ message: "Failed to upload image" });
            }

            const imageId = responseData.id;
            gift.linkToImage = `${DOMAIN}/images/${imageId}`;
        }
    }

    try {
        const updatedGift = await gift.save()
        res.json(updatedGift)
    } catch (error) {
        res.json({ message: error.message })
    }
})


//Get gift by ID
router.get("/:giftId", authMiddleware, async (req, res) => {
    const requesterTelegramId = req.user.telegramId;
    try {
        const gift = await Gift.findById(req.params.giftId).populate('tags').lean();
        if (!gift) {
            return res.status(404).json({ message: "Gift not found" });
        }

        // Получаем информацию о владельце подарка
        const ownerUser = await User.findOne({
            telegramId: gift.owner
        }).select('telegramId username firstName lastName photo_url').lean();

        // Добавляем информацию о владельце в объект подарка
        gift.ownerInfo = ownerUser ? {
            telegramId: ownerUser.telegramId,
            username: ownerUser.username,
            firstName: ownerUser.firstName,
            lastName: ownerUser.lastName,
            photo_url: ownerUser.photo_url
        } : null;

        const events = await Event.find({ gifts: gift._id }).lean();
        gift.events = events;

        if (gift.donation) {
            const donationPop = await Donation.findById(gift.donation).populate({
                path: 'donors',
                populate: {
                    path: 'user',
                    select: 'telegramId username firstName lastName photo_url language currency'
                }
            }).lean();

            if (donationPop && donationPop.donors) {
                const donationTotal = donationPop.donors.reduce((sum, donor) => sum + (donor.amount || 0), 0);
                gift.donationAmount = donationTotal;
            }
        }

        // --- НАЧАЛО: ПРОВЕРКА ДОСТУПА ---
        const isPublic = !gift.viewers || gift.viewers.length === 0;

        // Если подарок публичный, отдаем его сразу
        if (isPublic) {
            return res.json(gift);
        }

        // Если подарок приватный, проверяем права
        const requesterUser = await User.findOne({ telegramId: requesterTelegramId }).select('_id');

        const isOwner = gift.owner === requesterTelegramId;
        const isViewer = requesterUser ? gift.viewers.includes(requesterUser._id) : false;

        if (isOwner || isViewer) {
            return res.json(gift);
        }
        // --- КОНЕЦ: ПРОВЕРКА ДОСТУПА ---

        return res.status(404).json({ message: "Gift not found" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Mark gift as (un)reserved
router.patch("/:giftId", authMiddleware, async (req, res) => {
    try {
        const gift = await Gift.findById(req.params.giftId)

        if (!gift) {
            return res.status(404).json({ message: "Gift not found" });
        }

        if (gift.owner == req.user.telegramId) {
            return res.status(403).json({ message: "You cannot reserve your own gift" })
        }
        if (gift.isReserved === false) {
            gift.reservedBy = req.user.telegramId

            const sender = await User.findOne({ telegramId: req.user.telegramId });
            const recipient = await User.findOne({ telegramId: gift.owner });

            if (sender && recipient) {
                createNotification({
                    recipientId: recipient._id,
                    senderId: sender._id,
                    notificationType: 'GIFT_RESERVED',
                    message: `${sender.firstName || sender.username} забронировал подарок ${gift.name}`,
                    message_en: `${sender.firstName || sender.username} reserved ${gift.name}`,
                    entityId: gift._id,
                    entityModel: 'Gift'
                });
            }
        } else {
            gift.reservedBy = undefined
        }
        gift.isReserved = !gift.isReserved
        const updatedGift = await gift.save()
        res.json(updatedGift)
    } catch (error) {
        res.json({ message: error.message })
    }
})

router.patch("/mark-given/:giftId", authMiddleware, async (req, res) => {
    try {
        const gift = await Gift.findById(req.params.giftId)
        if (gift.owner !== req.user.telegramId) {
            return res.status(403).json({ message: "Not authorized to update this gift" })
        }
        gift.isGiven = !gift.isGiven

        if (gift.isGiven) {
            const sender = await User.findOne({ telegramId: gift.reservedBy });
            const recipient = await User.findOne({ telegramId: gift.owner });

            if (sender && recipient) {
                createNotification({
                    recipientId: recipient._id,
                    senderId: sender._id,
                    notificationType: 'GIFT_GIVEN',
                    message: `${sender.firstName || sender.username} подарил вам ${gift.name}`,
                    message_en: `${sender.firstName || sender.username} gave you ${gift.name}`,
                    entityId: gift._id,
                    entityModel: 'Gift'
                });
            }
        }

        const updatedGift = await gift.save()
        res.json(updatedGift)
    } catch (error) {
        res.json({ message: error.message })
    }
})

//Delete gift
router.delete("/:giftId", authMiddleware, async (req, res) => {
    try {
        const gift = await Gift.findById(req.params.giftId)
        if (!gift) {
            return res.status(404).json({ message: "Gift not found" })
        }

        if (gift.owner !== req.user.telegramId) {
            return res.status(403).json({ message: "Not authorized to delete this gift" })
        }

        await Gift.findByIdAndDelete(req.params.giftId)
        res.json("Gift deleted")
    } catch (error) {
        res.json({ message: error.message })
    }
})

/**
 * @swagger
 * /gifts/search/{telegramId}:
 *   get:
 *     summary: Поиск подарков в профиле пользователя с фильтрацией и сортировкой
 *     tags: [Gifts]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Telegram ID пользователя, в чьем вишлисте ищем подарки
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Поисковый запрос по названию подарка
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Валюта (например, RUB, USD, EUR)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Минимальная цена
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Максимальная цена
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: ID тегов, перечисленные через запятую без пробелов
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, expensive, cheapest, name_asc, name_desc]
 *         description: >
 *           Параметр сортировки:
 *           - `newest`: Сначала новые (по умолчанию)
 *           - `expensive`: Дороже
 *           - `cheapest`: Дешевле
 *           - `name_asc`: От А до Я
 *           - `name_desc`: От Я до А
 *     responses:
 *       200:
 *         description: Список найденных подарков
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Количество найденных подарков
 *                 gifts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Gift'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/search/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { q, minPrice, maxPrice, tags, sortBy, currency } = req.query;

    // --- Получаем владельца ---
    const ownerUser = await User.findOne({
      telegramId: parseInt(telegramId)
    }).select('telegramId username firstName lastName photo_url').lean();

    // --- Сортировка ---
    let sortOptions = {};
    switch (sortBy) {
      case 'expensive':
        sortOptions = { price: -1 };
        break;
      case 'cheapest':
        sortOptions = { price: 1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
        sortOptions = { name: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // --- Агрегация ---
    const gifts = await Gift.aggregate([
      // 1. Только подарки владельца
      { $match: { owner: parseInt(telegramId) } },

      // 2. Присоединяем теги
      {
        $lookup: {
          from: 'tags',
          localField: 'tags',
          foreignField: '_id',
          as: 'tagDocs'
        }
      },

      // 3. Поиск по q: в name ИЛИ в имени любого тега
      ...(q ? [{
        $match: {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { 'tagDocs.name': { $regex: q, $options: 'i' } }
          ]
        }
      }] : []),

      // 4. Фильтр по цене
      ...(minPrice || maxPrice ? [{
        $match: {
          price: {
            ...(minPrice ? { $gte: Number(minPrice) } : {}),
            ...(maxPrice ? { $lte: Number(maxPrice) } : {})
          }
        }
      }] : []),

      // 5. Фильтр по Валюте (НОВОЕ)
      ...(currency ? [{
        $match: {
          currency: { $regex: currency, $options: 'i' }
        }
      }] : []),

      // 6. Фильтр по тегам (по ID)
      ...(tags ? [{
        $match: {
          tags: {
            $in: tags.split(',')
              .map(id => id.trim())
              .filter(id => mongoose.Types.ObjectId.isValid(id))
              .map(id => new mongoose.Types.ObjectId(id))
          }
        }
      }] : []),

      // 7. Сортировка
      { $sort: sortOptions },

      // 8. Формируем теги: только нужные поля
      {
        $addFields: {
          tags: {
            $map: {
              input: '$tagDocs',
              as: 'tag',
              in: {
                _id: '$$tag._id',
                name: '$$tag.name',
                color: '$$tag.color',
                background: '$$tag.background'
              }
            }
          }
        }
      },

      // 9. Убираем временное поле
      { $unset: 'tagDocs' }
    ]);

    // --- Добавляем ownerInfo к каждому подарку ---
    const giftsWithOwnerInfo = gifts.map(gift => ({
      ...gift,
      ownerInfo: ownerUser ? {
        telegramId: ownerUser.telegramId,
        username: ownerUser.username,
        firstName: ownerUser.firstName,
        lastName: ownerUser.lastName,
        photo_url: ownerUser.photo_url
      } : null
    }));

    // --- Ответ ---
    res.json({
      count: giftsWithOwnerInfo.length,
      gifts: giftsWithOwnerInfo
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /gifts/donation:
 *   post:
 *     summary: Создать сбор средств или добавить средства к существующему
 *     tags: [Gifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - giftId
 *               - amount
 *             properties:
 *               giftId:
 *                 type: string
 *                 description: "_ID подарка"
 *               amount:
 *                 type: number
 *                 description: "Сумма взноса"
 *               isAnonymous:
 *                 type: boolean
 *                 description: "Анонимность"
 *     responses:
 *       200:
 *         description: Донорский взнос добавлен к подарку
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 donation:
 *                   $ref: '#/components/schemas/Donation'
 *                 donor:
 *                   $ref: '#/components/schemas/Donor'
 *                 gift:
 *                   $ref: '#/components/schemas/Gift'
 */
router.post("/donation", authMiddleware, async (req, res) => {
    try {
        const { giftId, amount, isAnonymous } = req.body;

        if (!giftId || amount == null) {
            return res.status(400).json({ message: "giftId amount" });
        }

        const gift = await Gift.findById(giftId);
        if (!gift) {
            return res.status(404).json({ message: "Gift not found." });
        }

        const donationAmount = Number(amount);
        if (isNaN(donationAmount) || donationAmount < 0) {
            return res.status(400).json({ message: "Incorrect amount." });
        }

        // Найти пользователя по telegramId
        const user = await User.findOne({ telegramId: req.user.telegramId });

        // Создаём Donor с _id пользователя
        const donor = new Donor({
            user: user._id,
            amount: donationAmount
        });
        const savedDonor = await donor.save();

        if (gift.donation) {
            // Уже есть donation — добавляем донера
            const donation = await Donation.findById(gift.donation);
            if (!donation) {
                // В случае некорректной ссылки — создаём новую Donation
                const newDonation = new Donation({
                    author: user._id,
                    donors: [savedDonor._id]
                });
                const savedDonation = await newDonation.save();
                gift.donation = savedDonation._id;
                await gift.save();
                return res.json({ donation: savedDonation, donor: savedDonor });
            }
            donation.donors.push(savedDonor._id);
            await donation.save();

            return res.json({ donation, donor: savedDonor });
        } else {
            // Нет donation у подарка — создаём новую Donation и связываем
            const newDonation = new Donation({
                author: user._id,
                donors: [savedDonor._id],
                isAnonymous: !!isAnonymous
            });
            const savedDonation = await newDonation.save();
            gift.donation = savedDonation._id;
            await gift.save();

            const recipient = await User.findOne({ telegramId: gift.owner });

            if (user && recipient) {
                await createNotification({
                    recipientId: recipient._id,
                    senderId: user._id,
                    notificationType: 'GIFT_FUNDRAISING_OPENED',
                    message: `${user.firstName || user.username} открыл сбор средств`,
                    message_en: `${user.firstName || user.username} opened a fundraiser`,
                    entityId: gift._id,
                    entityModel: 'Gift'
                });
            }

            if (gift.price && gift.price > 0) {
            // 1. Получаем полные данные всех доноров для подсчета суммы
            const allDonors = await Donor.find({ _id: { $in: currentDonation.donors } });
            
            // 2. Считаем текущую сумму
            const totalAmount = allDonors.reduce((sum, d) => sum + d.amount, 0);
            
            // 3. Считаем сумму ДО этого доната
            const previousAmount = totalAmount - donationAmount;

            // 4. Проверяем условие: Раньше было меньше цены, сейчас стало >= цены
            // Это гарантирует отправку только 1 раз
            if (previousAmount < gift.price && totalAmount >= gift.price) {
                
                // Находим владельца подарка
                const ownerUser = await User.findOne({ telegramId: gift.owner });
                
                // Собираем ID всех, кого нужно уведомить (Owner + Donors)
                // Используем Set, чтобы убрать дубликаты (если один юзер донатил 2 раза)
                const recipientsSet = new Set();
                
                if (ownerUser) {
                    recipientsSet.add(ownerUser._id.toString());
                }

                allDonors.forEach(d => {
                    if (d.user) {
                        recipientsSet.add(d.user.toString());
                    }
                });

                // Превращаем обратно в массив
                const uniqueRecipientIds = Array.from(recipientsSet);

                // Отправляем уведомления всем участникам
                const notificationPromises = uniqueRecipientIds.map(recipientId => {
                    return createNotification({
                        recipientId: recipientId,
                        senderId: user._id, // Кто завершил сбор (последний донатер)
                        notificationType: 'GIFT_FUNDRAISING_CLOSED',
                        message: `Сбор на ${gift.name} завершен`,
                        message_en: `The fundraiser for ${gift.name} has closed`,
                        entityId: gift._id,
                        entityModel: 'Gift'
                    });
                });

                await Promise.all(notificationPromises);
            }
        }

            return res.json({ donation: savedDonation, donor: savedDonor, gift });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.kig(err)
    }
});

/**
 * @swagger
 * /gifts/donation/{giftId}:
 *   delete:
 *     summary: Удалить сбор средств для подарка
 *     tags: [Gifts]
 *     parameters:
 *       - in: path
 *         name: giftId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID подарка, для которого нужно удалить сбор средств
 *     responses:
 *       200:
 *         description: Сбор средств для подарка успешно удален
 *       400:
 *         description: Некорректный ID подарка или сбор для подарка не найден
 *       403:
 *         description: У вас нет прав для удаления этого сбора
 *       404:
 *         description: Сбор средств для подарка не найден
 *       500:
 *         description: Ошибка сервера при удалении сбора
 */
router.delete("/donation/:giftId", authMiddleware, async (req, res) => {
    try {
        const giftId = req.params.giftId;
        const currentUserId = req.user.telegramId;

        const gift = await Gift.findById(giftId);
        if (!gift) {
            return res.status(404).json({ message: "Gift not found." });
        }

        const user = await User.findOne({ telegramId: currentUserId });

        const donation = await Donation.findById(gift.donation);

        if (!donation) {
            return res.status(404).json({ message: "No donation collection found for this gift." });
        }

        if (donation.author.toString() !== user._id.toString() && currentUserId !== gift.owner) {
            return res.status(403).json({ message: "You do not have permission to delete this donation collection." });
        }

        if (donation.donors && donation.donors.length > 0) {
            await Donor.deleteMany({ _id: { $in: donation.donors } });
        }
        await Donation.findByIdAndDelete(donation._id);
        gift.donation = null;
        await gift.save();

        res.status(200).json({ message: "Donation collection for the gift deleted successfully." });

    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid ID format." });
        }
        res.status(500).json({ message: err.message });
    }
});

/**
 * @swagger
 * /gifts/{giftId}/donors:
 *   get:
 *     summary: Получить историю внесших средства на сбор подарка с информацией о пользователях
 *     tags: [Gifts]
 *     parameters:
 *       - in: path
 *         name: giftId
 *         required: true
 *         schema:
 *           type: string
 *           description: "_ID подарка"
 *     responses:
 *       200:
 *         description: Внесшие средства на сбор подарка с информацией о пользователях
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 donationId:
 *                   type: string
 *                 donors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       donorId:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           telegramId:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           photo_url:
 *                             type: string
 *                           language:
 *                             type: string
 *                           currency:
 *                             type: string
 *                 totalAmount:
 *                   type: number
 *                   description: Общая сумма всех донатов
 *                 currency:
 *                   type: string
 *                   description: Валюта подарка
 *                 author:
 *                  type: object
 */
router.get("/:giftId/donors", authMiddleware, async (req, res) => {
    try {
        const requesterTelegramId = req.user.telegramId;
        const { giftId } = req.params;
        if (!giftId || !mongoose.Types.ObjectId.isValid(giftId)) {
            return res.status(400).json({ message: "Некорректный id подарка." });
        }

        const gift = await Gift.findById(giftId)
            .populate({
                path: 'donation',
                populate: [
                    {
                        path: 'donors',
                        populate: {
                            path: 'user',
                            select: 'telegramId username firstName lastName photo_url language currency'
                        }
                    },
                    {
                        path: 'author',
                        select: 'telegramId username firstName lastName photo_url language currency'
                    }
                ]
            });

        if (!gift) {
            return res.status(404).json({ message: "Подарок не найден." });
        }

        const donation = gift.donation;

        if (!donation) {
            return res.json({ donors: [], donationId: null, totalAmount: 0 });
        }
        const totalAmount = donation.donors.reduce((sum, donor) => sum + donor.amount, 0);
        if (!donation || !donation.donors) {
            return res.json({ donors: [], donationId: donation ? donation._id : null });
        }

        const isGiftOwner = gift.owner === requesterTelegramId;

        const isSurpriseMode = donation.isAnonymous && !gift.isGiven;

        const shouldHideDetails = isGiftOwner && isSurpriseMode;

        const donorsDetailed = donation.donors.map(donor => {
            if (!donor.user) return null;

            const isMe = donor.user.telegramId === requesterTelegramId;

            if (shouldHideDetails && !isMe) {
                return {
                    donorId: donor._id,
                    amount: donor.amount, 
                    createdAt: donor.createdAt,
                    user: {
                        telegramId: null,
                        username: "Аноним",
                        firstName: "Анонимный",
                        lastName: "Даритель",
                        photo_url: null, 
                        language: null,
                        currency: null,
                        isAnonymous: true 
                    }
                };
            }

            return {
                donorId: donor._id,
                amount: donor.amount,
                createdAt: donor.createdAt,
                user: {
                    telegramId: donor.user.telegramId,
                    username: donor.user.username,
                    firstName: donor.user.firstName,
                    lastName: donor.user.lastName,
                    photo_url: donor.user.photo_url,
                    language: donor.user.language,
                    currency: donor.user.currency
                }
            };
        }).filter(Boolean);

        res.json({
            donationId: donation._id,
            author: donation.author,
            donors: donorsDetailed,
            totalAmount: totalAmount,
            currency: gift.currency
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router
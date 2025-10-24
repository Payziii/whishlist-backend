import express from "express"
import mongoose from 'mongoose';
import User from "../models/user.model.js"
import Tag from '../models/tag.model.js';
import Gift from '../models/gift.model.js';
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

/**
 * @swagger
 * /users/by-id/{userId}:
 *   get:
 *     summary: Получить пользователя по Telegram ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: Telegram ID для поиска
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

router.get("/by-id/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findOne({ telegramId: userId }).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tags = await Tag.find({ owner: user.telegramId }).lean();

    const gifts = await Gift.find({ owner: user.telegramId }).lean();

    user.tags = tags;
    user.giftsCount = gifts.length;
    user.isBlocked = false;

    const me = await User.findOne({ telegramId: req.user.telegramId }).populate('blocked').lean();
    if (me && me.blocked && Array.isArray(me.blocked)) {
        if (me.blocked.some(blockedUser => blockedUser._id.toString() === user._id.toString())) {
            user.isBlocked = true;
        }
    }
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed' });
  }
});

/**
 * @swagger
 * /users/by-username/{username}:
 *   get:
 *     summary: Получить пользователя по его username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: Имя пользователя для поиска
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/by-username/:username", async (req, res) => {
    try {
        const username = req.params.username;

        const user = await User.findOne({ username }).lean();

        const tags = await Tag.find({ owner: user.telegramId }).lean();
        const gifts = await Gift.find({ owner: user.telegramId }).lean();

        user.tags = tags;
        user.giftsCount = gifts.length;
    
        res.status(201).json({ user });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed' });
    }
})

/**
 * @swagger
 * /users/all:
 *   get:
 *     summary: Получить всех пользователей
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Список всех пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/all", async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({ users });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to fetch users' });
    }
})

/**
 * @swagger
 * /users/settings:
 *   patch:
 *     summary: Обновить язык и/или валюту пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 description: Новый язык пользователя (например, 'en', 'ru')
 *               currency:
 *                 type: string
 *                 description: Новая валюта пользователя (например, 'USD', 'RUB')
 *               viewers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив ID или Telegram username пользователей, которым будет разрешен просмотр профиля. Если не указан или пуст, профиль будет виден всем.
 *               giftviewers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив ID или Telegram username пользователей, которым будет разрешен просмотр подаренных пользователем подарков. Если не указан или пуст, их будут видеть все.
 *     responses:
 *       200:
 *         description: Настройки пользователя успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Некорректные данные в теле запроса
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.patch("/settings", authMiddleware, async (req, res) => {
    try {
        const { language, currency, viewers, giftviewers } = req.body;
        const telegramId = req.user.telegramId;

        if (!language && !currency) {
            return res.status(400).json({ 
                error: 'At least one field is required: language or currency' 
            });
        }

        const updateData = {};
        if (language) {
            updateData.language = language;
        }
        if (currency) {
            updateData.currency = currency;
        }

        // +++ НАЧАЛО: ДОБАВЬТЕ ЛОГИКУ ВАЛИДАЦИИ ДЛЯ VIEWERS
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
                // +++ КОНЕЦ: ЛОГИКА ВАЛИДАЦИИ

                // +++ НАЧАЛО: ДОБАВЬТЕ ЛОГИКУ ВАЛИДАЦИИ ДЛЯ VIEWERS
                        let giftviewerObjectIds = [];
                        if (giftviewers && Array.isArray(giftviewers) && giftviewers.length > 0) {
                            const giftpotentialObjectIds = [];
                            const giftpotentialUsernames = [];
                    
                            giftviewers.forEach(identifier => {
                                if (mongoose.Types.ObjectId.isValid(identifier)) {
                                    giftpotentialObjectIds.push(identifier);
                                } else {
                                    giftpotentialUsernames.push(identifier);
                                }
                            });
                    
                            const giftfoundUsers = await User.find({
                                $or: [
                                    { '_id': { $in: giftpotentialObjectIds } },
                                    { 'username': { $in: giftpotentialUsernames } }
                                ]
                            }).select('_id');
                    
                            if (giftfoundUsers.length !== giftviewers.length) {
                                return res.status(400).json({ message: "One or more specified users for viewing were not found." });
                            }
                            giftviewerObjectIds = giftfoundUsers.map(user => user._id);
                        }
                        // +++ КОНЕЦ: ЛОГИКА ВАЛИДАЦИИ
                        updateData.viewers = viewerObjectIds;
                        updateData.giftviewers = giftviewerObjectIds;

        const updatedUser = await User.findOneAndUpdate(
            { telegramId: telegramId },
            { $set: updateData },
            { new: true } // Эта опция возвращает обновленный документ
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user: updatedUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to update user settings' });
    }
});

export default router
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

    // целевой пользователь
    const user = await User.findOne({ telegramId: userId }).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // запросивший пользователь (нам нужен _id и blocked)
    const me = await User.findOne({ telegramId: req.user.telegramId }).populate('blocked').lean();

    // Если у целевого пользователя есть viewers (и массив не пуст), 
    // то доступ только для этих пользователей или самого пользователя
    if (Array.isArray(user.viewers) && user.viewers.length > 0) {
      const requesterId = me ? me._id.toString() : null;
      const isOwner = (user._id && requesterId && user._id.toString() === requesterId);
      const isInViewers = requesterId && user.viewers.some(v => v.toString() === requesterId);

      if (!isOwner && !isInViewers) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // подгружаем теги и подарки (оставил вашу логику)
    const tags = await Tag.find({ owner: user.telegramId }).lean();
    const gifts = await Gift.find({ owner: user.telegramId }).lean();

    user.tags = tags;
    user.giftsCount = gifts.length;
    user.isBlocked = false;

    // проверка, заблокирован ли целевой пользователь текущим пользователем
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
router.get("/all", authMiddleware, async (req, res) => {
    try {
        const me = await User.findOne({ telegramId: req.user.telegramId }).lean();
        if (!me) {
            return res.status(404).json({ error: "Requester not found" });
        }

        // 1. Запрашиваем пользователей и статистику подарков параллельно для скорости
        const [users, giftStats] = await Promise.all([
            User.find({}).lean(),
            Gift.aggregate([
                {
                    $group: {
                        _id: "$owner", // Группируем по telegramId владельца
                        count: { $sum: 1 } // Считаем количество
                    }
                }
            ])
        ]);

        // 2. Превращаем массив статистики в удобный объект (Map)
        // { "telegramId1": 5, "telegramId2": 10 }
        const giftsMap = {};
        giftStats.forEach(stat => {
            giftsMap[stat._id] = stat.count;
        });

        const filteredUsers = users.filter(user => {
            const viewers = user.viewers || [];

            // Логика фильтрации (без изменений)
            if (viewers.length === 0) return true;
            if (user._id.toString() === me._id.toString()) return true;
            return viewers.some(v => v.toString() === me._id.toString());
        });

        // 3. Добавляем giftsCount к каждому отфильтрованному пользователю
        const result = filteredUsers.map(user => ({
            ...user,
            // Берем из карты или ставим 0, если подарков нет
            giftsCount: giftsMap[user.telegramId] || 0 
        }));

        res.status(200).json({ users: result });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

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
import express from "express";
import mongoose from "mongoose";
import Gift from "../models/gift.model.js";
import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createNotification } from "../services/notification.service.js";

const router = express.Router();

/**
 * @swagger
 * /thanks/gifts:
 *   get:
 *     summary: Получить список подарков без благодарности
 *     description: Возвращает все подаренные подарки пользователя (isGiven = true), за которые еще не была отправлена благодарность (isThanked = false)
 *     tags: [Thanks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список подарков без благодарности
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Gift'
 *       401:
 *         description: Пользователь не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/gifts", authMiddleware, async (req, res) => {
    try {
        const ownerUser = await User.findOne({
            telegramId: req.user.telegramId
        }).select('telegramId username firstName lastName photo_url').lean();

        const gifts = await Gift.find({
            owner: req.user.telegramId,
            isGiven: true,
            isThanked: false
        })
        .populate({
            path: "donation",
            populate: {
                path: "donors",
                populate: { path: "user", select: 'telegramId username firstName lastName photo_url' }
            }
        })
        .populate("tags")
        .lean();

        const giftsWithDetails = [];

        for (const gift of gifts) {
            // Информация о зарезервировавшем (если подарок был одним человеком, не через сбор)
            let reservedByInfo = null;
            if (gift.reservedBy) {
                reservedByInfo = await User.findOne({
                    telegramId: gift.reservedBy
                }).select('telegramId username firstName lastName photo_url').lean();
            }

            // Информация о всех донатерах при сборе
            let donatorsInfo = [];
            if (gift.donation && gift.donation.donors) {
                const uniqueUsers = new Map();
                gift.donation.donors.forEach(donor => {
                    if (donor.user && !uniqueUsers.has(donor.user.telegramId)) {
                        uniqueUsers.set(donor.user.telegramId, donor.user);
                    }
                });
                donatorsInfo = Array.from(uniqueUsers.values());
            }

            giftsWithDetails.push({
                ...gift,
                ownerInfo: ownerUser,
                reservedByInfo: reservedByInfo,
                donatorsInfo: donatorsInfo
            });
        }

        res.json(giftsWithDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


/**
 * @swagger
 * /thanks/gifts:
 *   post:
 *     summary: Отправить благодарности за все подаренные, но не отблагодаренные подарки
 *     description: 
 *       Отправляет благодарности за все подарки, у которых `isGiven = true` и `isThanked = false`.  
 *     tags: [Thanks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Благодарности успешно отправлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thank-you notifications sent for all gifts
 *       403:
 *         description: Нет прав на отправку благодарности
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/gifts", authMiddleware, async (req, res) => {
    try {
        const sender = await User.findOne({ telegramId: req.user.telegramId });
        if (!sender) {
            return res.status(404).json({ message: "Sender not found" });
        }

        // Находим все подарки пользователя, которые подарены, но без благодарности
        const gifts = await Gift.find({
            owner: req.user.telegramId,
            isGiven: true,
            isThanked: false
        })
            .populate({
                path: "donation",
                populate: {
                    path: "donors",
                    populate: { path: "user" }
                }
            });

        if (!gifts.length) {
            return res.json({ message: "No gifts to thank for" });
        }

        for (const gift of gifts) {
            // --- если есть сбор ---
            if (gift.donation) {
                const donors = gift.donation.donors || [];
                const uniqueUsers = new Map();

                for (const donor of donors) {
                    if (donor.user && !uniqueUsers.has(donor.user._id.toString())) {
                        uniqueUsers.set(donor.user._id.toString(), donor.user);
                    }
                }

                for (const user of uniqueUsers.values()) {
                    await createNotification({
                        recipientId: user._id,
                        senderId: sender._id,
                        notificationType: "GIFT_THANK_YOU_NOTE",
                        message: `${sender.firstName || sender.username} поблагодарил вас за ${gift.name}`,
                        message_en: `${sender.firstName || sender.username} thanked you for ${gift.name}`,
                        description: req.body.message || "",
                        entityId: gift._id,
                        entityModel: "Gift"
                    });
                }
            }
            // --- если сбора нет ---
            else if (gift.reservedBy) {
                const recipient = await User.findOne({ telegramId: gift.reservedBy });
                if (recipient) {
                    await createNotification({
                        recipientId: recipient._id,
                        senderId: sender._id,
                        notificationType: "GIFT_THANK_YOU_NOTE",
                        message: `${sender.firstName || sender.username} поблагодарил вас за ${gift.name}`,
                        message_en: `${sender.firstName || sender.username} thanked you for ${gift.name}`,
                        description: req.body.message || "",
                        entityId: gift._id,
                        entityModel: "Gift"
                    });
                }
            }

            // Помечаем подарок как отблагодаренный
            gift.isThanked = true;
            await gift.save();
        }

        res.json({ message: "Thank-you notifications sent for all gifts" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /thanks/events/{eventId}:
 *   post:
 *     summary: Отправить благодарность всем участникам завершенного события
 *     description: Создает уведомления с благодарностью от создателя события для всех его участников.
 *     tags: [Thanks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID события
 *     responses:
 *       200:
 *         description: Благодарности успешно отправлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Thank-you messages sent to all event participants"
 *       400:
 *         description: Некорректный запрос (неверный ID или не владелец события)
 *       401:
 *         description: Пользователь не авторизован
 *       404:
 *         description: Событие не найдено
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/events/:eventId", authMiddleware, async (req, res) => {
    try {
        const { eventId } = req.params;
        const telegramId = req.user.telegramId;

        // Проверяем корректность ID
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID" });
        }

        // Находим событие и его участников
        const event = await Event.findById(eventId).populate("members");
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Проверяем, что текущий пользователь — создатель события
        if (event.owner !== telegramId) {
            return res.status(403).json({ message: "You are not the owner of this event" });
        }

        const sender = await User.findOne({ telegramId });
        if (!sender) {
            return res.status(404).json({ message: "Sender not found" });
        }

        // Если у события нет участников — просто возвращаем сообщение
        if (!event.members || event.members.length === 0) {
            return res.json({ message: "No participants to thank" });
        }

        // Отправляем благодарность каждому участнику
        for (const member of event.members) {
            await createNotification({
                recipientId: member._id,
                senderId: sender._id,
                notificationType: "EVENT_THANK_YOU",
                message: `${sender.firstName || sender.username} поблагодарил вас за ${event.name}`,
                message_en: `${sender.firstName || sender.username} thanked you for ${event.name}`,
                description: req.body.message || "",
                entityId: event._id,
                entityModel: "Event"
            });
        }

        res.json({ message: "Thank-you messages sent to all event participants" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

export default router;

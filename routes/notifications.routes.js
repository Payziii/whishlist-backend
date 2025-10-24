import express from "express";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Управление уведомлениями пользователей
 *
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор уведомления.
 *           example: 60d0fe4f5311236168a109cb
 *         recipient:
 *           type: string
 *           description: ID пользователя-получателя уведомления.
 *           example: 60d0fe4f5311236168a109ca
 *         sender:
 *           type: string
 *           description: ID пользователя-инициатора уведомления (отправителя).
 *           example: 60d0fe4f5311236168a109cc
 *         type:
 *           type: string
 *           description: Тип уведомления.
 *           enum:
 *             - FRIEND_REQUEST
 *             - FRIEND_REQUEST_ACCEPTED
 *             - FRIEND_REQUEST_DECLINED
 *             - EVENT_INVITATION
 *             - EVENT_PARTICIPANT_JOINED
 *             - EVENT_PARTICIPANT_LEFT
 *             - EVENT_STARTING_SOON
 *             - EVENT_THANK_YOU
 *             - EVENT_COMPLETED
 *             - EVENT_GIFTERS_REVEALED
 *             - GIFT_RESERVED
 *             - GIFT_GIVEN
 *             - GIFT_THANK_YOU_NOTE
 *             - GIFT_FUNDRAISING_OPENED
 *             - GIFT_FUNDRAISING_CLOSED
 *           example: FRIEND_REQUEST
 *         message:
 *           type: string
 *           description: Текст уведомления, который видит пользователь.
 *           example: "Иван Иванов хочет с вами дружить"
 *         entityId:
 *           type: string
 *           description: ID связанной сущности (события, подарка, пользователя).
 *           example: 60d0fe4f5311236168a109cd
 *         isRead:
 *           type: boolean
 *           description: Статус прочтения уведомления.
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания уведомления.
 *           example: "2024-08-25T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления уведомления.
 *           example: "2024-08-25T10:00:00Z"
 */

// --- GET ALL (Получить все уведомления пользователя) ---

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Получить список всех уведомлений текущего пользователя
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Успешный ответ со списком уведомлений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;
        
        const currentUser = await User.findOne({ telegramId: currentUserTelegramId });

        const notifications = await Notification.find({ recipient: currentUser._id })
            .populate('sender', 'telegramId firstName lastName username photo_url') 
            .sort({ createdAt: -1 });

        res.status(200).json(notifications);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- GET UNREAD (Получить непрочитанные уведомления) ---

/**
 * @swagger
 * /notifications/unread:
 *   get:
 *     summary: Получить список непрочитанных уведомлений
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Список непрочитанных уведомлений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/unread", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;
        const currentUser = await User.findOne({ telegramId: currentUserTelegramId });

        const unreadNotifications = await Notification.find({
            recipient: currentUser._id,
            isRead: false
        })
        .populate('sender', 'telegramId firstName lastName username photo_url') 
        .sort({ createdAt: -1 });

        res.status(200).json(unreadNotifications);

    } catch (error)
        {
        res.status(500).json({ message: error.message });
    }
});

// --- MARK AS READ (Отметить конкретное уведомление как прочитанное) ---

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Отметить конкретное уведомление как прочитанное
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID уведомления для отметки
 *     responses:
 *       200:
 *         description: Уведомление успешно отмечено как прочитанное
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Уведомление не найдено или не принадлежит пользователю
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.patch("/:notificationId/read", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;
        const { notificationId } = req.params;

        const currentUser = await User.findOne({ telegramId: currentUserTelegramId });
        
        const updatedNotification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: currentUser._id },
            { $set: { isRead: true } },
            { new: true } 
        ).populate('sender', 'telegramId firstName lastName username photo_url');

        if (!updatedNotification) {
            return res.status(404).json({ message: 'Notification not found or you do not have permission to edit it.' });
        }

        res.status(200).json(updatedNotification);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- MARK ALL AS READ (Отметить все уведомления как прочитанные) ---

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     summary: Отметить все уведомления как прочитанные
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Все уведомления успешно отмечены как прочитанные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully marked 5 notifications as read."
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/read-all", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;
        const currentUser = await User.findOne({ telegramId: currentUserTelegramId });
        
        const result = await Notification.updateMany(
            { recipient: currentUser._id, isRead: false },
            { $set: { isRead: true } }
        ).populate('sender', 'telegramId firstName lastName username photo_url');

        res.status(200).json({ 
            message: `Successfully marked ${result.modifiedCount} notifications as read.`,
            count: result.modifiedCount
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
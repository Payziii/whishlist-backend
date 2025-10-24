import express from "express"
import User from "../models/user.model.js"
import FriendRequest from "../models/friendRequest.model.js";
import { authMiddleware } from '../middleware/auth.middleware.js'
import { createNotification } from '../services/notification.service.js';

const router = express.Router()
/**
 * @swagger
 * /friends/{userId}/list:
 *   get:
 *     summary: Получить список друзей
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: Telegram ID пользователя, для которого нужно получить список друзей
 *     responses:
 *       201:
 *         description: Массив пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
 /**
 * @swagger
 * /friends/{friendId}/add:
 *   post:
 *     summary: Добавить друга
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: friendId
 *         schema:
 *           type: string
 *         required: true
 *         description: Telegram ID друга, которого нужно добавить
 *     responses:
 *       200:
 *         description: Успешное добавление друга
 *       404:
 *         description: Пользователь или друг для добавления не найден
 */
router.post("/:friendId/add", authMiddleware, async (req, res) => {
    try {
        const userId = req.params.friendId;
        const friendId = req.user.telegramId;
        const friendToAdd = await User.findOne({ telegramId: friendId });
        const userToAdd = await User.findOne({ telegramId: userId });

        await User.findOneAndUpdate(
            { telegramId: userId },
            { $addToSet: { friends: friendToAdd._id } },
            { new: true }
        );

        await User.findOneAndUpdate(
            { telegramId: friendId },
            { $addToSet: { friends: userToAdd._id } },
            { new: true }
        );
        res.status(201).json({ message: 'Friend added successfully' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to add friend' });
    }
})

router.get("/:friendId/list", authMiddleware, async (req, res) => {
    try {
        const userId = req.params.friendId;
        const userWithFriends = await User.findOne({ telegramId: userId })
            .populate('friends');
        const friends = userWithFriends?.friends ?? [];
        res.status(200).json({ friends: friends });
    } catch (error) 
    {
        console.log(error)
        res.status(500).json({ error: 'Failed to get friends' });
    }
})

/**
 * @swagger
 * /friends/{friendId}/remove:
 *   delete:
 *     summary: Удалить друга
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         schema:
 *           type: string
 *         required: true
 *         description: Telegram ID пользователя, которого нужно удалить из друзей
 *     responses:
 *       200:
 *         description: Друг успешно удален
 *       404:
 *         description: Пользователь или друг для удаления не найден
 *       500:
 *         description: Ошибка при удалении друга
 */
router.delete("/:friendId/remove", authMiddleware, async (req, res) => {
    try {
        const friendToRemoveTelegramId = req.params.friendId;
        const currentUserTelegramId = req.user.telegramId;

        const friendDocument = await User.findOne({ telegramId: friendToRemoveTelegramId });
        const currentUserDocument = await User.findOne({ telegramId: currentUserTelegramId });

        if (!friendDocument || !currentUserDocument) {
            return res.status(404).json({ message: 'User or friend to remove not found' });
        }

        await User.findByIdAndUpdate(
            friendDocument._id,
            { $pull: { friends: currentUserDocument._id } }
        );
        
        await User.findByIdAndUpdate(
            currentUserDocument._id,
            { $pull: { friends: friendDocument._id } }
        );

        res.status(200).json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

/**
 * @swagger
 * /friends/request/{recipientTelegramId}:
 *   post:
 *     summary: Отправить заявку в друзья
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: recipientTelegramId
 *         schema: { type: number }
 *         required: true
 *         description: Telegram ID пользователя, которому отправляется заявка
 *     responses:
 *       201: { description: Заявка успешно отправлена }
 *       400: { description: Некорректный запрос (например, заявка самому себе или повторная заявка) }
 *       404: { description: Пользователь не найден }
 */
router.post("/request/:recipientTelegramId", authMiddleware, async (req, res) => {
    try {
        const initiatorTelegramId = req.user.telegramId;
        const recipientTelegramId = req.params.recipientTelegramId;

        if (Number(initiatorTelegramId) === Number(recipientTelegramId)) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself." });
        }

        const initiator = await User.findOne({ telegramId: initiatorTelegramId });
        const recipient = await User.findOne({ telegramId: recipientTelegramId });

        if (!initiator || !recipient) {
            return res.status(404).json({ message: "One of the users was not found." });
        }
        
        if (initiator.friends.includes(recipient._id)) {
            return res.status(400).json({ message: "You are already friends with this user." });
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { requester: initiator._id, recipient: recipient._id, status: 'pending' },
                { requester: recipient._id, recipient: initiator._id, status: 'pending' }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ message: "A friend request is already pending between you and this user." });
        }

        const newRequest = new FriendRequest({
            requester: initiator._id,
            recipient: recipient._id
        });
        await newRequest.save();

        createNotification({
            recipientId: recipient._id,
            senderId: initiator._id,
            notificationType: 'FRIEND_REQUEST',
            message: `${initiator.firstName || initiator.username} хочет с вами дружить`,
            entityId: newRequest._id,
            entityModel: 'FriendRequest'
        });

        res.status(201).json({ message: 'Friend request sent successfully', request: newRequest });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

/**
 * @swagger
 * /friends/request/{recipientTelegramId}/cancel:
 *   delete:
 *     summary: Отменить отправленную заявку в друзья
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: recipientTelegramId
 *         schema:
 *           type: string
 *         required: true
 *         description: Telegram ID пользователя, которому была отправлена заявка
 *     responses:
 *       200:
 *         description: Заявка успешно отменена
 *       404:
 *         description: Заявка не найдена
 *       500:
 *         description: Ошибка при отмене заявки
 */
router.delete("/request/:recipientTelegramId/cancel", authMiddleware, async (req, res) => {
    try {
        const initiatorTelegramId = req.user.telegramId;
        const recipientTelegramId = req.params.recipientTelegramId;

        const initiator = await User.findOne({ telegramId: initiatorTelegramId });
        const recipient = await User.findOne({ telegramId: recipientTelegramId });

        if (!initiator || !recipient) {
            return res.status(404).json({ message: "User not found." });
        }

        const request = await FriendRequest.findOne({
            requester: initiator._id,
            recipient: recipient._id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ message: "Friend request not found." });
        }

        await FriendRequest.findByIdAndDelete(request._id);

        res.status(200).json({ message: "Friend request cancelled successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to cancel friend request." });
    }
});

/**
 * @swagger
 * /friends/request/{requestId}/respond:
 *   post:
 *     summary: Ответить на входящую заявку в друзья
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         schema: { type: string }
 *         required: true
 *         description: ID заявки в друзья (_id из модели FriendRequest)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, decline]
 *                 description: "Принять ('accept') или отклонить ('decline') заявку"
 *     responses:
 *       200: { description: Ответ на заявку успешно обработан }
 *       400: { description: Неверное действие }
 *       404: { description: Заявка не найдена или не принадлежит вам }
 */
router.post("/request/:requestId/respond", authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body; // 'accept' or 'decline'
        const currentUserTelegramId = req.user.telegramId;

        const currentUser = await User.findOne({ telegramId: currentUserTelegramId });
        if (!currentUser) {
            return res.status(404).json({ message: "Authenticated user not found." });
        }

        const request = await FriendRequest.findOne({ _id: requestId, recipient: currentUser._id, status: 'pending' });

        if (!request) {
            return res.status(404).json({ message: "Friend request not found or you don't have permission to respond." });
        }

        if (action === 'accept') {
            request.status = 'accepted';
            await request.save();

            await User.findByIdAndUpdate(request.requester, { $addToSet: { friends: request.recipient } });
            await User.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.requester } });

            const requesterUser = await User.findById(request.requester);
            createNotification({
                recipientId: requesterUser._id,
                senderId: currentUser._id,
                notificationType: 'FRIEND_REQUEST_ACCEPTED',
                message: `${currentUser.firstName || currentUser.username} принял вашу заявку в друзья`,
                entityId: currentUser._id,
                entityModel: 'User'
            });

            return res.status(200).json({ message: "Friend request accepted." });

        } else if (action === 'decline') {
            await FriendRequest.findByIdAndDelete(request._id);

            const requesterUser = await User.findById(request.requester);
            createNotification({
                recipientId: requesterUser._id,
                senderId: currentUser._id,
                notificationType: 'FRIEND_REQUEST_DECLINED',
                message: `${currentUser.firstName || currentUser.username} отклонил вашу заявку в друзья`,
                entityId: currentUser._id,
                entityModel: 'User'
            });
            return res.status(200).json({ message: "Friend request declined." });

        } else {
            return res.status(400).json({ message: "Invalid action. Use 'accept' or 'decline'." });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to respond to friend request' });
    }
});

/**
 * @swagger
 * /friends/requests/incoming:
 *   get:
 *     summary: Получить список входящих заявок в друзья
 *     tags: [Friends]
 *     responses:
 *       200:
 *         description: Список входящих заявок
 */
router.get("/requests/incoming", authMiddleware, async (req, res) => {
    try {
        const currentUser = await User.findOne({ telegramId: req.user.telegramId });
        const requests = await FriendRequest.find({ recipient: currentUser._id, status: 'pending' })
            .populate('requester', 'telegramId username firstName lastName photo_url');
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get incoming requests' });
    }
});

/**
 * @swagger
 * /friends/requests/outgoing:
 *   get:
 *     summary: Получить список исходящих заявок в друзья
 *     tags: [Friends]
 *     responses:
 *       200:
 *         description: Список исходящих заявок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FriendRequest'
 */
router.get("/requests/outgoing", authMiddleware, async (req, res) => {
    try {
        const currentUser = await User.findOne({ telegramId: req.user.telegramId });
        const requests = await FriendRequest.find({ 
            requester: currentUser._id, 
            status: 'pending' 
        })
            .populate('recipient', 'telegramId username firstName lastName photo_url');
        
        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get outgoing requests' });
    }
});

/**
 * @swagger
 * /friends/{userId}/block:
 *   post:
 *     summary: Заблокировать пользователя
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: Telegram ID пользователя, которого нужно заблокировать
 *     responses:
 *       200:
 *         description: Пользователь успешно заблокирован
 *       400:
 *         description: Невозможно заблокировать самого себя
 *       404:
 *         description: Пользователь для блокировки не найден
 *       500:
 *         description: Ошибка при блокировке пользователя
 */
router.post("/:userId/block", authMiddleware, async (req, res) => {
    try {
        const targetUserTelegramId = req.params.userId;
        const blockingUserTelegramId = req.user.telegramId;

        if (Number(targetUserTelegramId) === Number(blockingUserTelegramId)) {
            return res.status(400).json({ message: "You cannot block yourself." });
        }

        const targetUser = await User.findOne({ telegramId: targetUserTelegramId });
        const blockingUser = await User.findOne({ telegramId: blockingUserTelegramId });

        if (!targetUser) {
            return res.status(404).json({ message: "User to block not found." });
        }
        if (!blockingUser) {
            return res.status(404).json({ message: "Authenticated user not found." });
        }

        await User.findByIdAndUpdate(
            blockingUser._id,
            { $addToSet: { blocked: targetUser._id } },
            { new: true }
        );

        await User.findByIdAndUpdate(
            blockingUser._id,
            { $pull: { friends: targetUser._id } },
            { new: true }
        );
        await User.findByIdAndUpdate(
            targetUser._id,
            { $pull: { friends: blockingUser._id } },
            { new: true }
        );

        await FriendRequest.deleteOne({
            $or: [
                { requester: blockingUser._id, recipient: targetUser._id },
                { requester: targetUser._id, recipient: blockingUser._id }
            ]
        });

        res.status(200).json({ message: 'User blocked successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to block user' });
    }
});

/**
 * @swagger
 * /friends/{userId}/unblock:
 *   delete:
 *     summary: Разблокировать пользователя
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: Telegram ID пользователя, которого нужно разблокировать
 *     responses:
 *       200:
 *         description: Пользователь успешно разблокирован
 *       404:
 *         description: Пользователь для разблокировки не найден или не был заблокирован
 *       500:
 *         description: Ошибка при разблокировке пользователя
 */
router.delete("/:userId/unblock", authMiddleware, async (req, res) => {
    try {
        const targetUserTelegramId = req.params.userId;
        const unblockingUserTelegramId = req.user.telegramId;

        const targetUser = await User.findOne({ telegramId: targetUserTelegramId });
        const unblockingUser = await User.findOne({ telegramId: unblockingUserTelegramId });

        if (!targetUser) {
            return res.status(404).json({ message: "User to unblock not found." });
        }
        if (!unblockingUser) {
            return res.status(404).json({ message: "Authenticated user not found." });
        }

        if (!unblockingUser.blocked.includes(targetUser._id)) {
            return res.status(404).json({ message: "User was not blocked." });
        }

        await User.findByIdAndUpdate(
            unblockingUser._id,
            { $pull: { blocked: targetUser._id } },
            { new: true }
        );

        res.status(200).json({ message: 'User unblocked successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to unblock user' });
    }
});

export default router
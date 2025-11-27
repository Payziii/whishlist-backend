import Notification from '../models/notification.model.js';

/**
 * @typedef {'FRIEND_REQUEST' | 'FRIEND_REQUEST_ACCEPTED' | 'FRIEND_REQUEST_DECLINED' |
 *           'EVENT_INVITATION' | 'EVENT_PARTICIPANT_JOINED' | 'EVENT_PARTICIPANT_LEFT' |
 *           'EVENT_STARTING_SOON' | 'EVENT_THANK_YOU' | 'EVENT_COMPLETED' | 'EVENT_GIFTERS_REVEALED' |
 *           'GIFT_RESERVED' | 'GIFT_GIVEN' | 'GIFT_THANK_YOU_NOTE' |
 *           'GIFT_FUNDRAISING_OPENED' | 'GIFT_FUNDRAISING_CLOSED'
 *          } NotificationType
 */

/**
 * Создает и сохраняет уведомление в базе данных.
 * @param {object} params - Параметры для создания уведомления.
 * @param {string} params.recipientId - ObjectId получателя.
 * @param {NotificationType} params.notificationType - Тип уведомления.
 * @param {string} params.message - Текст уведомления.
 * @param {string} params.entityId - ObjectId связанной сущности (пользователь, событие, подарок).
 * @param {string} params.entityModel - Модель связанной сущности ('User', 'Event', 'Gift', 'FriendRequest').
 * @param {string} [params.senderId] - ObjectId отправителя (опционально).
 */
export const createNotification = async ({ recipientId, senderId, notificationType, message, description, entityId, entityModel }) => {
    try {
        if (!recipientId || !notificationType || !message || !entityId || !entityModel) { 
            throw new Error('Missing required parameters for notification');
        }

        const notification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type: notificationType,
            message,
            description,
            entityId,
            entityModel
        });

        await notification.save();
        console.log(`Notification created: ${notificationType} for user ${recipientId}`);
    } catch (error) {
        console.error('Failed to create notification:', error.message);
    }
};

/**
 * Удаляет уведомление по критериям.
 * @param {object} criteria - Объект фильтра для поиска удаляемого уведомления.
 */
export const deleteNotification = async (criteria) => {
    try {
        // Удаляем уведомление(я), соответствующие критериям
        await Notification.deleteMany(criteria);
        console.log('Notification(s) deleted based on criteria:', criteria);
    } catch (error) {
        console.error('Failed to delete notification:', error.message);
    }
};
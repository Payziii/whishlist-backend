import crypto from 'crypto'

export const verifyTelegramWebAppData = (initData) => {
    const data = new URLSearchParams(initData);
    const hash = data.get('hash');
    data.delete('hash');
    data.sort();
    
    const dataString = Array.from(data.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
        .update(process.env.BOT_TOKEN)
        .digest();
    
    const signature = crypto.createHmac('sha256', secretKey)
        .update(dataString)
        .digest('hex');
    
    return signature === hash;
}

export const authMiddleware = async (req, res, next) => {
    try {
        const initData = req.headers['initdata'];
        if (!initData) return res.status(401).json({ message: 'Unauthorized' });
        
        if (!verifyTelegramWebAppData(initData)) {
            return res.status(401).json({ message: 'Invalid init data' });
        }

        const data = new URLSearchParams(initData);
        const user_data = JSON.parse(data.get('user'));
        req.user = { telegramId: user_data.id };
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

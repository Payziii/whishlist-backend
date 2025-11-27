import express from "express"

const router = express.Router()

const parseSize = (sizeStr) => {
    const value = parseInt(sizeStr);
    const unit = sizeStr.toLowerCase().replace(/[\d\.]/g, ''); 

    if (unit.includes('gb')) return value * 1024 * 1024 * 1024;
    if (unit.includes('mb')) return value * 1024 * 1024;
    if (unit.includes('kb')) return value * 1024;
    return value; // по умолчанию байты
}

router.get("/max-limit", async (req, res) => {
    try {
        const limitStr = process.env.MAX_UPLOAD_LIMIT || '5mb';
        
        const limitBytes = parseSize(limitStr);

        res.json({ 
            limit: limitStr, 
            bytes: limitBytes 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router
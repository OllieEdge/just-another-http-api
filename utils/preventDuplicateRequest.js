const crypto = require('crypto');
const { redis } = require('eip-cloud-services');

const TIMEFRAME_TO_PREVENT_DUPLICATE_REQUEST_SECONDS = 5

const hash = (item) => {
    return crypto.createHash('sha256').update(item).digest('hex');
};

module.exports = async ( req ) => {
    const clientIP = req.ip;
    const requestBodyHash = hash(JSON.stringify(req.body));
    const finalhash = hash(requestBodyHash);
    const cacheKey = `hashedRequests:${clientIP}:${finalhash}`;
    
    try {
        const existingRequest = await redis.get(cacheKey);
        if (existingRequest)  {
            const error = new Error('Too many requests');
            error.code = 429;
            throw error;
        }
        await redis.set(cacheKey, '1', TIMEFRAME_TO_PREVENT_DUPLICATE_REQUEST_SECONDS);
    } catch (err) {
        throw err;
    }
};

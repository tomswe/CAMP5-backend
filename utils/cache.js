import { redisClient } from '../config/redis.config.js';

export async function invalidateImagesCache() {
    try {
        await redisClient.del('images:all');
    } catch (error) {
        console.error('Failed to invalidate images cache:', error);
    }
}
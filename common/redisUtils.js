const {
	redisClient,
	safeRedisOperation,
	isRedisHealthy,
} = require("../config/redisConfig");

/**
 * Redis utility functions with error handling
 * These functions provide graceful degradation when Redis is unavailable
 */

/**
 * Safe Redis GET operation
 * @param {string} key - Redis key
 * @returns {Promise<string|null>} - Value or null if error/not found
 */
const safeGet = async (key) => {
	try {
		return await redisClient.get(key);
	} catch (error) {
		console.warn(`Redis GET error for key "${key}":`, error.message);
		return null;
	}
};

/**
 * Safe Redis SET operation
 * @param {string} key - Redis key
 * @param {string} value - Value to set
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<boolean>} - Success status
 */
const safeSet = async (key, value, ttl = null) => {
	try {
		if (ttl) {
			await redisClient.setex(key, ttl, value);
		} else {
			await redisClient.set(key, value);
		}
		return true;
	} catch (error) {
		console.warn(`Redis SET error for key "${key}":`, error.message);
		return false;
	}
};

/**
 * Safe Redis DELETE operation
 * @param {string} key - Redis key
 * @returns {Promise<boolean>} - Success status
 */
const safeDel = async (key) => {
	try {
		await redisClient.del(key);
		return true;
	} catch (error) {
		console.warn(`Redis DEL error for key "${key}":`, error.message);
		return false;
	}
};

/**
 * Safe Redis EXISTS operation
 * @param {string} key - Redis key
 * @returns {Promise<boolean>} - Whether key exists
 */
const safeExists = async (key) => {
	try {
		const result = await redisClient.exists(key);
		return result === 1;
	} catch (error) {
		console.warn(`Redis EXISTS error for key "${key}":`, error.message);
		return false;
	}
};

/**
 * Safe Redis HGET operation
 * @param {string} key - Redis hash key
 * @param {string} field - Hash field
 * @returns {Promise<string|null>} - Value or null if error/not found
 */
const safeHGet = async (key, field) => {
	try {
		return await redisClient.hget(key, field);
	} catch (error) {
		console.warn(
			`Redis HGET error for key "${key}", field "${field}":`,
			error.message
		);
		return null;
	}
};

/**
 * Safe Redis HSET operation
 * @param {string} key - Redis hash key
 * @param {string} field - Hash field
 * @param {string} value - Value to set
 * @returns {Promise<boolean>} - Success status
 */
const safeHSet = async (key, field, value) => {
	try {
		await redisClient.hset(key, field, value);
		return true;
	} catch (error) {
		console.warn(
			`Redis HSET error for key "${key}", field "${field}":`,
			error.message
		);
		return false;
	}
};

/**
 * Safe Redis EXPIRE operation
 * @param {string} key - Redis key
 * @param {number} seconds - Expiration time in seconds
 * @returns {Promise<boolean>} - Success status
 */
const safeExpire = async (key, seconds) => {
	try {
		await redisClient.expire(key, seconds);
		return true;
	} catch (error) {
		console.warn(`Redis EXPIRE error for key "${key}":`, error.message);
		return false;
	}
};

/**
 * Check if Redis is available
 * @returns {Promise<boolean>} - Redis availability status
 */
const isRedisAvailable = async () => {
	try {
		await redisClient.ping();
		return true;
	} catch (error) {
		return false;
	}
};

/**
 * Safe Redis pipeline operation
 * @param {Function} pipelineCallback - Callback function that receives pipeline instance
 * @returns {Promise<Array|null>} - Pipeline results or null if error
 */
const safePipeline = async (pipelineCallback) => {
	try {
		const pipeline = redisClient.pipeline();
		pipelineCallback(pipeline);
		return await pipeline.exec();
	} catch (error) {
		console.warn("Redis pipeline error:", error.message);
		return null;
	}
};

module.exports = {
	safeGet,
	safeSet,
	safeDel,
	safeExists,
	safeHGet,
	safeHSet,
	safeExpire,
	isRedisAvailable,
	safePipeline,
	// Export the client for direct access when needed
	redisClient,
};

const Redis = require("ioredis");
require("dotenv").config();

// Redis configuration with better error handling
const redisConfig = {
	host: process.env.REDIS_HOST || "127.0.0.1",
	port: process.env.REDIS_PORT || 6379,
	db: process.env.REDISDB || 0,
	maxRetriesPerRequest: 3, // Reduced to prevent MaxRetriesPerRequestError
	connectTimeout: 10000, // 10 seconds
	lazyConnect: true, // Don't connect immediately, wait for first command
	retryStrategy: (times) => {
		// Exponential backoff with max delay
		const delay = Math.min(times * 1000, 30000); // Max 30 seconds
		console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
		return times > 5 ? null : delay; // Stop retrying after 5 attempts
	},
	reconnectOnError: (err) => {
		// Reconnect on specific errors
		const targetErrors = [
			"READONLY",
			"ECONNRESET",
			"ENOTFOUND",
			"ENETUNREACH",
			"ETIMEDOUT",
		];
		return targetErrors.some((targetError) =>
			err.message.includes(targetError)
		);
	},
};

// Add Railway-specific Redis URL if available
if (process.env.REDIS_URL) {
	redisConfig.host = undefined;
	redisConfig.port = undefined;
	redisConfig.db = undefined;
	// Railway provides REDIS_URL environment variable for connection
	console.log("Using Redis URL from Railway environment");
}

const redisClient = new Redis(process.env.REDIS_URL || redisConfig);

// Connection event handlers
redisClient.on("error", (err) => {
	console.error(`Redis connection error: ${err.message}`);
	// Don't crash the app, just log the error
});

redisClient.on("connect", () => {
	console.log("Connected to Redis successfully");
});

redisClient.on("ready", () => {
	console.log("Redis client is ready");
});

redisClient.on("reconnecting", (delay) => {
	console.log(`Reconnecting to Redis in ${delay}ms`);
});

redisClient.on("close", () => {
	console.log("Redis connection closed");
});

redisClient.on("end", () => {
	console.log("Redis connection ended");
});

// Test connection on startup (optional)
const testRedisConnection = async () => {
	try {
		await redisClient.ping();
		console.log("Redis connection test successful");
	} catch (error) {
		console.warn("Redis connection test failed:", error.message);
		console.warn("Application will continue without Redis caching");
	}
};

// Test connection after a short delay to allow for initial connection
setTimeout(testRedisConnection, 2000);

// Graceful shutdown handler
process.on("SIGTERM", () => {
	console.log("Closing Redis connection...");
	redisClient.disconnect();
});

process.on("SIGINT", () => {
	console.log("Closing Redis connection...");
	redisClient.disconnect();
});

module.exports = redisClient;

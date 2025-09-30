const Redis = require("ioredis");
require("dotenv").config();

// Create Redis client with proper URL or fallback configuration
let redisClient;

if (process.env.REDIS_URL) {
	// Use Redis URL (for Railway or other cloud providers)
	console.log("Using Redis URL from environment variable");
	redisClient = new Redis(process.env.REDIS_URL, {
		maxRetriesPerRequest: 3,
		connectTimeout: 10000,
		lazyConnect: true,
		retryStrategy: (times) => {
			const delay = Math.min(times * 1000, 30000);
			console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
			return times > 5 ? null : delay;
		},
		reconnectOnError: (err) => {
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
	});
} else {
	// Fallback to individual Redis configuration
	console.log("Using individual Redis configuration (host/port)");
	redisClient = new Redis({
		host: process.env.REDIS_HOST || "127.0.0.1",
		port: process.env.REDIS_PORT || 6379,
		db: process.env.REDISDB || 0,
		maxRetriesPerRequest: 3,
		connectTimeout: 10000,
		lazyConnect: true,
		retryStrategy: (times) => {
			const delay = Math.min(times * 1000, 30000);
			console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
			return times > 5 ? null : delay;
		},
		reconnectOnError: (err) => {
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
	});
}

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

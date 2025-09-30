const Redis = require("ioredis");
require("dotenv").config();

// Create Redis client with proper URL or fallback configuration
let redisClient;

if (process.env.REDIS_URL) {
	// Use Redis URL (for Railway or other cloud providers)
	console.log("Using Redis URL from environment variable");
	console.log("Redis URL host:", new URL(process.env.REDIS_URL).hostname);

	redisClient = new Redis(process.env.REDIS_URL, {
		maxRetriesPerRequest: 10, // Increased retries for Railway deployment
		connectTimeout: 30000, // Increased timeout for Railway
		commandTimeout: 10000,
		lazyConnect: true,
		enableReadyCheck: false,
		maxRetriesPerRequest: null, // Disable retry limit for commands
		retryDelayOnFailover: 100,
		enableOfflineQueue: false,
		retryStrategy: (times) => {
			const delay = Math.min(times * 2000, 60000); // Exponential backoff with max 60s
			console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
			// Allow more retries during Railway deployment
			return times > 15 ? null : delay;
		},
		reconnectOnError: (err) => {
			console.log("Reconnect on error triggered:", err.message);
			const targetErrors = [
				"READONLY",
				"ECONNRESET",
				"ENOTFOUND",
				"ENETUNREACH",
				"ETIMEDOUT",
				"ECONNREFUSED",
			];
			return targetErrors.some((targetError) =>
				err.message.includes(targetError)
			);
		},
		// Railway specific configuration
		family: 4, // Force IPv4
		keepAlive: true,
		// Additional Railway optimizations
		connectTimeout: 60000,
		lazyConnect: true,
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
	// For Railway deployment, ENOTFOUND errors are common during startup
	if (
		err.message.includes("ENOTFOUND") &&
		err.message.includes("railway.internal")
	) {
		console.log(
			"Railway Redis internal network issue detected. This is normal during deployment."
		);
	}
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

// Test connection on startup with retries
const testRedisConnection = async (retries = 5) => {
	for (let i = 0; i < retries; i++) {
		try {
			await redisClient.ping();
			console.log("Redis connection test successful");
			return true;
		} catch (error) {
			console.warn(
				`Redis connection test failed (attempt ${i + 1}/${retries}):`,
				error.message
			);
			if (i < retries - 1) {
				const delay = (i + 1) * 3000; // Progressive delay: 3s, 6s, 9s, etc.
				console.log(`Waiting ${delay}ms before retry...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}
	console.warn(
		"All Redis connection tests failed. Application will continue without Redis caching"
	);
	return false;
};

// Test connection after Railway deployment settles
setTimeout(() => {
	testRedisConnection(8); // More retries for Railway
}, 5000); // Longer initial delay for Railway

// Graceful shutdown handler
process.on("SIGTERM", () => {
	console.log("Closing Redis connection...");
	redisClient.disconnect();
});

process.on("SIGINT", () => {
	console.log("Closing Redis connection...");
	redisClient.disconnect();
});

// Helper function to safely execute Redis commands
const safeRedisOperation = async (operation, fallback = null) => {
	try {
		const result = await operation();
		return result;
	} catch (error) {
		console.warn("Redis operation failed:", error.message);
		return fallback;
	}
};

// Export both client and helper
module.exports = {
	redisClient,
	safeRedisOperation,
};

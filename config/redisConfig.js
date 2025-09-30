const Redis = require("ioredis");
require("dotenv").config();

// Create Redis client with proper URL or fallback configuration
let redisClient;

if (process.env.REDIS_URL) {
	// Use Redis URL (for Railway or other cloud providers)
	console.log("Using Redis URL from environment variable");
	console.log("Redis URL host:", new URL(process.env.REDIS_URL).hostname);

	redisClient = new Redis(process.env.REDIS_URL, {
		connectTimeout: 60000, // Increased timeout for Railway
		commandTimeout: 15000,
		lazyConnect: true,
		enableReadyCheck: false,
		maxRetriesPerRequest: null, // Disable retry limit for commands
		retryDelayOnFailover: 1000,
		enableOfflineQueue: true, // Enable offline queue to prevent "Stream isn't writeable" errors
		maxLoadingTimeout: 30000, // Wait longer for Redis to be ready
		retryStrategy: (times) => {
			const delay = Math.min(times * 3000, 120000); // Exponential backoff with max 2 minutes
			console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
			// Allow more retries during Railway deployment with longer delays
			return times > 20 ? null : delay;
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
				"getaddrinfo",
			];
			return targetErrors.some((targetError) =>
				err.message.includes(targetError)
			);
		},
		// Railway specific configuration
		family: 4, // Force IPv4
		keepAlive: true,
		// Additional Railway optimizations
		autoResubscribe: true,
		autoResendUnfulfilledCommands: true,
		// Add DNS lookup timeout
		dns: {
			timeout: 10000,
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
	// For Railway deployment, ENOTFOUND errors are common during startup
	if (
		err.message.includes("ENOTFOUND") ||
		err.message.includes("railway.internal") ||
		err.message.includes("getaddrinfo")
	) {
		console.log(
			"Railway Redis network issue detected. This is normal during deployment startup."
		);
		// Don't exit the process, let retry strategy handle it
		return;
	}
	// Don't crash the app, just log the error
});

redisClient.on("connect", () => {
	console.log("Connected to Redis successfully");
});

redisClient.on("ready", () => {
	console.log("Redis client is ready and operational");
});

redisClient.on("reconnecting", (delay) => {
	console.log(`Reconnecting to Redis in ${delay}ms...`);
});

redisClient.on("close", () => {
	console.log("Redis connection closed - will attempt to reconnect");
});

redisClient.on("end", () => {
	console.log("Redis connection ended");
});

// Test connection on startup with retries
const testRedisConnection = async (retries = 10) => {
	console.log("Starting Redis connection test...");

	for (let i = 0; i < retries; i++) {
		try {
			// Wait for connection to be ready first
			if (redisClient.status !== "ready") {
				await redisClient.connect();
			}

			await redisClient.ping();
			console.log("✅ Redis connection test successful");
			return true;
		} catch (error) {
			console.warn(
				`⚠️ Redis connection test failed (attempt ${i + 1}/${retries}):`,
				error.message
			);

			if (i < retries - 1) {
				const delay = Math.min((i + 1) * 5000, 30000); // Progressive delay: 5s, 10s, 15s, up to 30s
				console.log(`⏳ Waiting ${delay}ms before retry...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	console.warn(
		"❌ All Redis connection tests failed. Application will continue without Redis caching"
	);
	return false;
};

// Test connection after Railway deployment settles
// Use longer delay for Railway's DNS propagation
setTimeout(() => {
	testRedisConnection(12); // More retries with longer delays for Railway
}, 10000); // Longer initial delay for Railway DNS to propagate

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
		// Check if Redis is connected before attempting operation
		if (redisClient.status !== "ready") {
			console.warn("Redis not ready, using fallback value");
			return fallback;
		}

		const result = await operation();
		return result;
	} catch (error) {
		console.warn("Redis operation failed:", error.message);
		return fallback;
	}
};

// Helper function to check Redis health
const isRedisHealthy = () => {
	return redisClient.status === "ready";
};

// Export both client and helper
module.exports = {
	redisClient,
	safeRedisOperation,
	isRedisHealthy,
};

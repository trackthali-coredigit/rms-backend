const Redis = require("ioredis");
require("dotenv").config();

// Create Redis client with proper URL or fallback configuration
let redisClient;

if (process.env.REDIS_URL) {
	// Use Redis URL (for Railway or other cloud providers)
	console.log("Using Redis URL from environment variable");
	console.log("Redis URL host:", new URL(process.env.REDIS_URL).hostname);

	// For Railway compatibility, append family=0 parameter if not already present
	let redisUrl = process.env.REDIS_URL;
	if (redisUrl.includes("railway.internal") && !redisUrl.includes("family=")) {
		const separator = redisUrl.includes("?") ? "&" : "?";
		redisUrl = `${redisUrl}${separator}family=0`;
		console.log("Added family=0 parameter for Railway compatibility");
	}

	redisClient = new Redis(redisUrl, {
		connectTimeout: 90000, // Extended timeout for Railway (90s)
		commandTimeout: 20000, // Extended command timeout
		lazyConnect: true,
		enableReadyCheck: false,
		maxRetriesPerRequest: null, // Disable retry limit for commands
		retryDelayOnFailover: 2000, // Longer delay on failover
		enableOfflineQueue: true, // Enable offline queue to prevent "Stream isn't writeable" errors
		maxLoadingTimeout: 60000, // Wait longer for Redis to be ready (60s)
		retryStrategy: (times) => {
			const delay = Math.min(times * 3000, 120000); // Exponential backoff with max 2 minutes
			console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
			// More retries for Railway deployment
			const maxRetries =
				process.env.RAILWAY_ENVIRONMENT ||
				process.env.REDIS_URL?.includes("railway")
					? 30
					: 20;
			return times > maxRetries ? null : delay;
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
				"railway.internal", // Railway-specific error
			];
			return targetErrors.some((targetError) =>
				err.message.includes(targetError)
			);
		},
		// Railway specific configuration - CRITICAL FIX for ENOTFOUND errors
		family: 0, // Enable dual-stack (IPv4 + IPv6) lookups - fixes Railway IPv6 issues
		keepAlive: true,
		// Additional Railway optimizations
		autoResubscribe: true,
		autoResendUnfulfilledCommands: true,
		// Add DNS lookup timeout
		dns: {
			timeout: 15000, // Extended DNS timeout for Railway
		},
		// Railway-specific socket options
		socket: {
			keepAlive: true,
			keepAliveInitialDelay: 30000,
		},
	});
} else {
	// Fallback to individual Redis configuration
	console.log("Using individual Redis configuration (host/port)");
	redisClient = new Redis({
		host: process.env.REDIS_HOST || "127.0.0.1",
		port: process.env.REDIS_PORT || 6379,
		db: process.env.REDISDB || 0,
		maxRetriesPerRequest: 5, // Increased retries
		connectTimeout: 30000, // Increased timeout
		lazyConnect: true,
		retryStrategy: (times) => {
			const delay = Math.min(times * 1000, 30000);
			console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
			return times > 10 ? null : delay; // More retries
		},
		reconnectOnError: (err) => {
			const targetErrors = [
				"READONLY",
				"ECONNRESET",
				"ENOTFOUND",
				"ENETUNREACH",
				"ETIMEDOUT",
				"ECONNREFUSED", // Added this error type
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

// Function to initialize Redis connection (to be called from main app)
const initializeRedis = async () => {
	// For Railway, wait longer before attempting connection
	const isRailway =
		process.env.RAILWAY_ENVIRONMENT ||
		process.env.REDIS_URL?.includes("railway");
	const initialDelay = isRailway ? 20000 : 5000; // 20s for Railway, 5s for others

	console.log("Initializing Redis connection...");
	console.log(`Waiting ${initialDelay}ms before Redis initialization...`);
	await new Promise((resolve) => setTimeout(resolve, initialDelay));

	// More retries for Railway with longer delays
	const retries = isRailway ? 20 : 8;
	return testRedisConnection(retries);
};

// Test connection on startup with retries
const testRedisConnection = async (retries = 15) => {
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
				// Progressive delay with longer intervals for Railway
				const isRailway =
					process.env.RAILWAY_ENVIRONMENT ||
					process.env.REDIS_URL?.includes("railway");
				const baseDelay = isRailway ? 8000 : 5000; // 8s for Railway, 5s for others
				const delay = Math.min((i + 1) * baseDelay, isRailway ? 60000 : 30000);
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

// Don't auto-initialize on module load - let the main app control when to connect

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

// Export both client and helper functions
module.exports = {
	redisClient,
	safeRedisOperation,
	isRedisHealthy,
	initializeRedis, // Export the initialization function
};

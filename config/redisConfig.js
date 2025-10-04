const Redis = require("ioredis");
require("dotenv").config();

let redisClient;

// Check if REDIS_URL is provided (for production/Heroku)
if (process.env.REDIS_URL) {
	// Use Redis URL for connection (production/Heroku)
	redisClient = new Redis(process.env.REDIS_URL, {
		maxRetriesPerRequest: 50,
		retryStrategy: (times) => {
			return Math.min(times * 50, 2000);
		},
		// Additional options for secure connections
		tls: process.env.REDIS_TLS === "true" ? {} : undefined,
		lazyConnect: true,
	});
} else {
	// Use individual host/port configuration (local development)
	redisClient = new Redis({
		host: process.env.REDIS_HOST || "127.0.0.1",
		port: process.env.REDIS_PORT || 6379,
		db: process.env.REDISDB || 0,
		password: process.env.REDIS_PASSWORD || undefined,
		maxRetriesPerRequest: 50,
		retryStrategy: (times) => {
			return Math.min(times * 50, 2000);
		},
		lazyConnect: true,
	});
}

redisClient.on("error", (err) => {
	// console.error(`Error connecting to Redis: ${err}`);
});

redisClient.on("connect", () => {
	console.log("Connected to Redis");
});

redisClient.on("reconnecting", (delay) => {
	console.log(`Reconnecting to Redis in ${delay}ms`);
});
module.exports = redisClient;

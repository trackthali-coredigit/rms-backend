#!/usr/bin/env node

/**
 * Redis Health Check Script for Railway Deployment
 * This script helps diagnose Redis connection issues during deployment
 */

const { redisClient, isRedisHealthy } = require("../config/redisConfig");

async function checkRedisHealth() {
	console.log("🔍 Starting Redis Health Check...");
	console.log("📍 Environment:", process.env.NODE_ENV || "development");
	console.log(
		"🚂 Railway Check:",
		process.env.RAILWAY_ENVIRONMENT ? "Yes" : "No"
	);

	if (process.env.REDIS_URL) {
		const url = new URL(process.env.REDIS_URL);
		console.log("🔗 Redis URL Host:", url.hostname);
		console.log("🔗 Redis URL Port:", url.port);
	} else {
		console.log("🔗 Redis Host:", process.env.REDIS_HOST || "127.0.0.1");
		console.log("🔗 Redis Port:", process.env.REDIS_PORT || 6379);
	}

	console.log("📊 Redis Client Status:", redisClient.status);

	// Test connection with timeout
	const testConnection = async () => {
		try {
			console.log("🏃 Testing Redis ping...");
			const start = Date.now();
			const result = await Promise.race([
				redisClient.ping(),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Ping timeout")), 10000)
				),
			]);
			const duration = Date.now() - start;
			console.log(`✅ Redis ping successful: ${result} (${duration}ms)`);
			return true;
		} catch (error) {
			console.log(`❌ Redis ping failed: ${error.message}`);
			return false;
		}
	};

	// Test with retries
	let attempts = 0;
	const maxAttempts = 5;

	while (attempts < maxAttempts) {
		attempts++;
		console.log(`\n🔄 Attempt ${attempts}/${maxAttempts}`);

		const success = await testConnection();
		if (success) {
			console.log("\n🎉 Redis is healthy and ready!");
			process.exit(0);
		}

		if (attempts < maxAttempts) {
			const delay = attempts * 2000;
			console.log(`⏳ Waiting ${delay}ms before next attempt...`);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	console.log("\n⚠️ Redis health check failed after all attempts");
	console.log("💡 This might be normal during Railway deployment startup");
	console.log(
		"💡 The application should continue to work with graceful Redis degradation"
	);
	process.exit(1);
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
	console.log("\n👋 Shutting down Redis health check...");
	redisClient.disconnect();
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("\n👋 Shutting down Redis health check...");
	redisClient.disconnect();
	process.exit(0);
});

// Start the health check
checkRedisHealth().catch((error) => {
	console.error("💥 Health check error:", error);
	process.exit(1);
});

const { db } = require("./db");

const { redisClient, isRedisHealthy } = require("./redisConfig.js");
const { safeGet, safeSet, safeDel } = require("../common/redisUtils.js");
const { getIO } = require("./socketSetup.js");

var emitToSockets = async (userId, eventName, data) => {
	console.log("userId, eventName, data", userId, eventName, data);

	try {
		// Use safe Redis operations that handle connection failures gracefully
		if (!isRedisHealthy()) {
			console.warn("Redis not available for socket emission, skipping");
			return;
		}

		const socketIds = await redisClient.lrange(`user:${userId}:sockets`, 0, -1);
		console.log("socketIds", socketIds);

		socketIds.forEach((socketId) => {
			const socket = getIO().sockets.sockets.get(socketId);
			if (socket) {
				console.log("emit sent");
				socket.emit(eventName, data);
			}
		});
	} catch (error) {
		console.log("error in emitToSocket", error);
	}
};

function socketConfig(io) {
	// io.adapter(redisAdapter(redisClient));
	io.on("connection", async (socket) => {
		console.log("connection", socket.id);
		socket.on("socket_register", async function (data) {
			console.log("socket_register ->", data.user_id, socket.id);
			let user_id = data.user_id;
			socket.user_id = user_id;

			try {
				if (isRedisHealthy()) {
					await redisClient.lpush(`user:${user_id}:sockets`, socket.id);
					const socketIds = await redisClient.lrange(
						`user:${user_id}:sockets`,
						0,
						-1
					);
					console.log("socketIds", socketIds);
				} else {
					console.warn("Redis not available for socket registration");
				}
			} catch (error) {
				console.warn("Error registering socket:", error.message);
			}
		});

		socket.on("disconnect", async (sockets) => {
			console.log("disconnectedSocketId", socket.id, socket.user_id);
			try {
				if (isRedisHealthy()) {
					await redisClient.lrem(
						`user:${socket.user_id}:sockets`,
						0,
						socket.id
					);
				} else {
					console.warn("Redis not available for socket cleanup");
				}
			} catch (error) {
				console.log("Error during disconnect cleanup:", error.message);
			}
		});
		global.socket_id = socket.id;
	});

	const SOCKET_TIMEOUT = 30000; // Timeout value in milliseconds (adjust as needed)

	// Function to periodically check and disconnect sockets whose IDs have been removed from Redis
	setInterval(async () => {
		try {
			// Only run if Redis is healthy
			if (!isRedisHealthy()) {
				console.warn("Redis not available for socket cleanup interval");
				return;
			}

			// Get all user IDs stored in Redis
			const userIds = await redisClient.keys("user:*:sockets");
			// console.log("userIds=====>>>", userIds);
			// Iterate through each user ID
			for (const userId of userIds) {
				console.log("userId===>>>", userId);
				// Get all socket IDs associated with the current user from Redis
				const socketIds = await redisClient.lrange(userId, 0, -1);
				// console.log("socketIdss in disconnect",socketIds)
				// Iterate through each socket ID
				for (const socketId of socketIds) {
					// Check if the socket corresponding to the socket ID is disconnected
					const socket = io.sockets.sockets.get(socketId);

					if (!socket || !socket.connected) {
						// Socket is disconnected, disconnect it
						console.log("Disconnecting socket:", socketId);
						await redisClient.lrem(userId, 0, socketId);
					}
				}
			}
		} catch (error) {
			console.error("Error checking and disconnecting sockets:", error);
		}
	}, SOCKET_TIMEOUT);
}

module.exports = { socketConfig, emitToSockets };

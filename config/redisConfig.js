const Redis = require("ioredis");
require('dotenv').config();

const redisClient = new Redis({
    host: process.env.REDIS_HOST, // or your custom host
    port: process.env.REDIS_PORT, // or your custom port
    db: process.env.REDISDB,
    maxRetriesPerRequest: 50, // Increase the number of retries
    retryStrategy: (times) => {
      // Reconnect after
      return Math.min(times * 50, 2000);
    },
});

redisClient.on('error', (err) => {
    // console.error(`Error connecting to Redis: ${err}`);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('reconnecting', (delay) => {
    console.log(`Reconnecting to Redis in ${delay}ms`);
  });
module.exports = redisClient;
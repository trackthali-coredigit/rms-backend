// Swagger configuration for the API
const swaggerJSDoc = require("swagger-jsdoc");
const {
	getServerUrl,
	isRailwayEnvironment,
} = require("./config/railwayConfig");

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "MABO APIs",
			version: "1.0.0",
			description:
				"API documentation for the MABO Restaurant Management System",
		},
		servers: [
			{
				url: "http://127.0.0.1:9000",
				description: "Local Development Server",
			},
			{
				url: "https://rms-backend-production-a81b.up.railway.app",
				description: "Railway Production (Fallback)",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
	},
	apis: [
		"./index.js",
		"./routers/super.admin.js",
		"./routers/admin.js",
		"./routers/barista.js",
		"./routers/user.js",
		"./routers/waiter.js",
	], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;

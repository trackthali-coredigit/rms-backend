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
				url: getServerUrl(),
				description: isRailwayEnvironment()
					? "Railway Production"
					: "Local Development",
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

// This file is only needed if you want to generate swagger.json dynamically from JSDoc comments.
const swaggerJSDoc = require("swagger-jsdoc");
const fs = require("fs");

// Determine the environment and set appropriate server URLs
const getServerUrls = () => {
	const servers = [];

	// Add Railway production server first (primary)
	servers.push({
		url: "https://rms-backend-production-a81b.up.railway.app",
		description: "Railway Production Server",
	});

	// Always include local development server as fallback
	servers.push({
		url: "http://127.0.0.1:9000",
		description: "Local Development Server",
	});

	// Add custom production URL if provided
	if (process.env.PRODUCTION_URL) {
		servers.push({
			url: process.env.PRODUCTION_URL,
			description: "Custom Production Server",
		});
	}

	return servers;
};

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "MABO APIs",
			version: "1.0.0",
			description:
				"API documentation for the MABO Restaurant Management System",
		},
		servers: getServerUrls(),
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
		// "./routers/barista.js",
		// "./routers/user.js",
		"./routers/waiter.js",
		"./routers/order.js",
		"./routers/customer.js",
	],
};

const swaggerSpec = swaggerJSDoc(options);
fs.writeFileSync("./swagger.json", JSON.stringify(swaggerSpec, null, 2));

console.log("swagger.json generated!");
console.log(`Generated ${swaggerSpec.servers.length} server(s):`);
swaggerSpec.servers.forEach((server, index) => {
	console.log(`  ${index + 1}. ${server.description}: ${server.url}`);
});

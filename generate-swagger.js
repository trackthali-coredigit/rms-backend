// This file is only needed if you want to generate swagger.json dynamically from JSDoc comments.
const swaggerJSDoc = require("swagger-jsdoc");
const fs = require("fs");

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
				// Add Env Swagger End Point
				url: "http://127.0.0.1:9000",
				description: "Local server",
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
	],
};

const swaggerSpec = swaggerJSDoc(options);
fs.writeFileSync("./swagger.json", JSON.stringify(swaggerSpec, null, 2));
console.log("swagger.json generated!");

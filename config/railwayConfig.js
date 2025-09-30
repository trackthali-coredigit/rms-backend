/**
 * Railway Environment Configuration Helper
 * This file helps detect Railway environment and configure appropriate settings
 */

const isRailwayEnvironment = () => {
	return !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL);
};

const getRailwayUrl = () => {
	if (process.env.RAILWAY_STATIC_URL) {
		return `https://${process.env.RAILWAY_STATIC_URL}`;
	}

	if (process.env.RAILWAY_SERVICE_NAME) {
		return `https://${process.env.RAILWAY_SERVICE_NAME}.up.railway.app`;
	}

	// Fallback - you'll need to replace 'your-app' with actual service name
	return `https://your-app.up.railway.app`;
};

const getServerUrl = () => {
	if (isRailwayEnvironment()) {
		return getRailwayUrl();
	}

	// Default to local development
	const port = process.env.PORT || 9000;
	return `http://127.0.0.1:${port}`;
};

const logEnvironmentInfo = () => {
	console.log("🚀 Environment Configuration:");
	console.log(
		`   📍 Railway Environment: ${isRailwayEnvironment() ? "Yes" : "No"}`
	);
	console.log(`   🌐 Server URL: ${getServerUrl()}`);
	console.log(
		`   🔧 Node Environment: ${process.env.NODE_ENV || "development"}`
	);

	if (isRailwayEnvironment()) {
		console.log(
			`   🚂 Railway Static URL: ${process.env.RAILWAY_STATIC_URL || "Not set"}`
		);
		console.log(
			`   🏷️  Railway Service: ${process.env.RAILWAY_SERVICE_NAME || "Not set"}`
		);
	}
};

module.exports = {
	isRailwayEnvironment,
	getRailwayUrl,
	getServerUrl,
	logEnvironmentInfo,
};

const fs = require("fs").promises;
const path = require("path");

const GetTermsAndConditions = async (req, res) => {
	try {
		const filePath = path.join(__dirname, "..", "policies", "terms_and_conditions.html");
		const content = await fs.readFile(filePath, "utf8");
		return res.status(200).json({
			Status: 1,
			status_code: 200,
			message: "Terms and Conditions fetched successfully",
			data: content,
		});
	} catch (error) {
		console.error("Error fetching Terms and Conditions:", error);
		return res.status(500).json({
			Status: 0,
			status_code: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

const GetPrivacyPolicy = async (req, res) => {
	try {
		const filePath = path.join(__dirname, "..", "policies", "privacy_policy.html");
		const content = await fs.readFile(filePath, "utf8");
		return res.status(200).json({
			Status: 1,
			status_code: 200,
			message: "Privacy Policy fetched successfully",
			data: content,
		});
	} catch (error) {
		console.error("Error fetching Privacy Policy:", error);
		return res.status(500).json({
			Status: 0,
			status_code: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

module.exports = {
	GetTermsAndConditions,
	GetPrivacyPolicy,
};

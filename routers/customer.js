const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth_middleware");
console.log("im in customer router");

const customer_routes = require("../controllers/customer");
const admin = require("../controllers/admin");
let validation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};

router.get(
	"/search/customers/by-number/:phone_number",
	authMiddleware,
	[
		check("phone_number")
			.not()
			.isEmpty()
			.withMessage("Phone number is required")
			.isNumeric()
			.withMessage("Phone number must contain only numbers"),
	],
	validation,
	customer_routes.searchCustomers
);

router.post(
	"/add/customer",
	[
		check("first_name")
			.not()
			.isEmpty()
			.withMessage("First name is required")
			.trim()
			.escape(),
		check("last_name")
			.not()
			.isEmpty()
			.withMessage("Last name is required")
			.trim()
			.escape(),
		// check("email")
		// 	.isEmail()
		// 	.not()
		// 	.isEmpty()
		// 	.withMessage("email is required")
		// 	.withMessage("Invalid email")
		// 	.normalizeEmail(),
		check("country_code")
			.not()
			.isEmpty()
			.withMessage("Country code is required")
			.trim()
			.escape(),
		check("iso_code")
			.not()
			.isEmpty()
			.withMessage("ISO code is required")
			.trim()
			.escape(),
		check("phone_no")
			.not()
			.isEmpty()
			.withMessage("Phone number is required")
			.trim()
			.escape()
			.isNumeric()
			.withMessage("Phone number must be a number"),
		// check("password")
		// 	.not()
		// 	.isEmpty()
		// 	.withMessage("Password is required")
		// 	.isLength({ min: 8 })
		// 	.withMessage("Password must be at least 8 characters long")
		// 	.trim()
		// 	.escape(),
		check("role")
			.not()
			.isEmpty()
			.withMessage("Role is required")
			.isIn(["super_admin", "admin", "waiter", "barista", "supervisor", "user"])
			.withMessage("Invalid role"),
	],
	validation,
	authMiddleware,
	customer_routes.addCustomer
);

module.exports = router;

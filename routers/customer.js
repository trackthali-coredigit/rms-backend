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

/**
 * @swagger
 * /search/customers/by-number/{phone_number}:
 *   get:
 *     summary: Search customers by phone number
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: phone_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer's phone number
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customers found
 *       400:
 *         description: Validation error
 */
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

/**
 * @swagger
 * /add/customer:
 *   post:
 *     summary: Add a new customer
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               country_code:
 *                 type: string
 *               iso_code:
 *                 type: string
 *               phone_no:
 *                 type: string
 *               role:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer added successfully
 *       400:
 *         description: Validation error
 */
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

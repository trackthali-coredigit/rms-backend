const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth_middleware");
console.log("im in user router");

const user_route = require("../controllers/user");
let validation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};
/**
 * @swagger
 * /userSignUp:
 *   post:
 *     summary: User sign up
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               device_id:
 *                 type: string
 *               device_type:
 *                 type: string
 *               device_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: User signed up
 *       400:
 *         description: Validation error
 */
router.post(
	"/userSignUp",
	[
		check("username")
			.not()
			.isEmpty()
			.withMessage("Username is required")
			.trim()
			.escape(),
		check("email")
			.not()
			.isEmpty()
			.withMessage("Email is required")
			.isEmail()
			.withMessage("Invalid email format")
			.trim()
			.escape(),
		check("password")
			.not()
			.isEmpty()
			.withMessage("Password is required")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters long")
			.trim()
			.escape(),
		check("device_id")
			.not()
			.isEmpty()
			.withMessage("Device ID is required")
			.trim()
			.escape(),
		check("device_type")
			.not()
			.isEmpty()
			.withMessage("Device type is required")
			.trim()
			.escape(),
		check("device_token")
			.not()
			.isEmpty()
			.withMessage("Device token is required")
			.trim()
			.escape(),
	],
	validation,
	user_route.userSignUp
);
/**
 * @swagger
 * /personalInformation:
 *   post:
 *     summary: Add personal information
 *     tags: [User]
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
 *     responses:
 *       200:
 *         description: Personal information added
 *       400:
 *         description: Validation error
 */
router.post(
	"/personalInformation",
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
			.withMessage("Phone number must be numeric"),
	],
	validation,
	authMiddleware,
	user_route.personalInformation
);
/**
 * @swagger
 * /confirmOrder:
 *   post:
 *     summary: Confirm an order
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_id:
 *                 type: string
 *               total_price:
 *                 type: number
 *               sub_total:
 *                 type: number
 *               discount:
 *                 type: number
 *               taxes:
 *                 type: number
 *               extra_charges:
 *                 type: number
 *               table_id:
 *                 type: string
 *               special_guest:
 *                 type: boolean
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     item_id:
 *                       type: string
 *                     item_image:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     note:
 *                       type: string
 *                     price:
 *                       type: number
 *                     item_name:
 *                       type: string
 *     responses:
 *       200:
 *         description: Order confirmed
 *       400:
 *         description: Validation error
 */
router.post(
	"/confirmOrder",
	[
		check("business_id")
			.not()
			.isEmpty()
			.withMessage("Business ID is required")
			.isNumeric()
			.withMessage("Business ID must be numeric")
			.trim()
			.escape(),
		check("total_price")
			.not()
			.isEmpty()
			.withMessage("Total price is required")
			.isFloat({ min: 0 })
			.withMessage("Total price must be a positive number")
			.trim()
			.escape(),
		check("sub_total")
			.not()
			.isEmpty()
			.withMessage("sub_total is required")
			.isFloat({ min: 0 })
			.withMessage("sub_total must be a positive number")
			.trim()
			.escape(),
		check("discount")
			.not()
			.isEmpty()
			.withMessage("discount is required")
			.isFloat({ min: 0 })
			.withMessage("discount must be a positive number")
			.trim()
			.escape(),
		check("taxes")
			.not()
			.isEmpty()
			.withMessage("taxes is required")
			.isFloat({ min: 0 })
			.withMessage("taxes must be a positive number")
			.trim()
			.escape(),
		check("extra_charges")
			.not()
			.isEmpty()
			.withMessage("extra_charges is required")
			.isFloat({ min: 0 })
			.withMessage("extra_charges must be a positive number")
			.trim()
			.escape(),
		check("table_id")
			.not()
			.isEmpty()
			.withMessage("Table ID is required")
			.isNumeric()
			.withMessage("Table ID must be numeric")
			.trim()
			.escape(),
		check("special_guest")
			.not()
			.isEmpty()
			.withMessage("Special guest is required")
			.isBoolean()
			.withMessage("Special guest must be a boolean")
			.trim()
			.escape(),
		check("orders")
			.isArray({ min: 1 })
			.withMessage("At least one order is required"),
		check("orders.*.item_id")
			.not()
			.isEmpty()
			.withMessage("Item ID is required for each order")
			.isNumeric()
			.withMessage("Item ID must be numeric")
			.trim()
			.escape(),
		check("orders.*.item_image")
			.not()
			.isEmpty()
			.withMessage("Item image is required for each order")
			.isString()
			.withMessage("Item image must be a string")
			.trim()
			.escape(),
		check("orders.*.quantity")
			.not()
			.isEmpty()
			.withMessage("Quantity is required for each order")
			.isNumeric()
			.withMessage("Quantity must be numeric")
			.trim()
			.escape(),
		check("orders.*.note").optional().trim().escape(),
		check("orders.*.price")
			.not()
			.isEmpty()
			.withMessage("Price is required for each order")
			.isNumeric()
			.withMessage("Price must be numeric")
			.trim()
			.escape(),
		check("orders.*.item_name")
			.not()
			.isEmpty()
			.withMessage("Item name is required for each order")
			.isString()
			.withMessage("Item name must be a string")
			.trim()
			.escape(),
	],
	validation,
	user_route.confirmOrder
);
/**
 * @swagger
 * /delete_account:
 *   delete:
 *     summary: Delete user account
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Account deleted
 *       400:
 *         description: Validation error
 */
router.delete("/delete_account", user_route.delete_account);

/**
 * @swagger
 * /getUserOrderList:
 *   get:
 *     summary: Get user order list
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: order_status
 *         schema:
 *           type: string
 *           enum: [in_progress, complete]
 *         required: true
 *         description: Order status
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         required: true
 *         description: Page number
 *     responses:
 *       200:
 *         description: User order list
 *       400:
 *         description: Validation error
 */
router.get(
	"/getUserOrderList",
	[
		check("order_status")
			.not()
			.isEmpty()
			.withMessage("order_status is required")
			.isIn(["in_progress", "complete"])
			.withMessage("Invalid value for 'value' parameter")
			.trim()
			.escape(),
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	user_route.getUserOrderList
);

/**
 * @swagger
 * /applyPromoCode:
 *   get:
 *     summary: Apply promo code
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Promo code
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Promo code applied
 *       400:
 *         description: Validation error
 */
router.get(
	"/applyPromoCode",
	[
		check("code")
			.not()
			.isEmpty()
			.withMessage("code is required")
			.trim()
			.escape(),
		check("business_id")
			.not()
			.isEmpty()
			.withMessage("business_id is required")
			.trim()
			.escape(),
	],
	validation,
	user_route.applyPromoCode
);
/**
 * @swagger
 * /expensesList:
 *   get:
 *     summary: Get user expenses list
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         required: true
 *         description: Page number
 *     responses:
 *       200:
 *         description: Expenses list
 *       400:
 *         description: Validation error
 */
router.get(
	"/expensesList",
	[
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	user_route.expensesList
);

console.log("im out of user router");
module.exports = router;

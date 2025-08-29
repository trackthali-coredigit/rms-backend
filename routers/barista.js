const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth_middleware");
console.log("im in barista router");
const validation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}
	next();
};
const baristas = require("../controllers/barista");

/**
 * @swagger
 * /BaristaOrderList:
 *   get:
 *     summary: Get barista order list
 *     tags: [Barista]
 *     parameters:
 *       - in: query
 *         name: list_for
 *         schema:
 *           type: string
 *           enum: [current_order, completed_order]
 *         required: true
 *         description: List type
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         required: true
 *         description: Page number
 *     responses:
 *       200:
 *         description: Barista order list
 *       422:
 *         description: Validation error
 */
router.get(
	"/BaristaOrderList",
	[
		check("list_for")
			.not()
			.isEmpty()
			.withMessage("list_for is required")
			.isIn(["current_order", "completed_order"])
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
	baristas.BaristaOrderList
);
/**
 * @swagger
 * /BaristaOrderAccept:
 *   put:
 *     summary: Accept a barista order
 *     tags: [Barista]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order accepted
 *       422:
 *         description: Validation error
 */
router.put(
	"/BaristaOrderAccept",
	[
		check("order_id")
			.not()
			.isEmpty()
			.withMessage("Order ID is required")
			.isNumeric()
			.withMessage("Order ID must be numeric")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	baristas.BaristaOrderAccept
);
/**
 * @swagger
 * /BaristaOrderMarkAsComplete:
 *   put:
 *     summary: Mark a barista order as complete
 *     tags: [Barista]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order marked as complete
 *       422:
 *         description: Validation error
 */
router.put(
	"/BaristaOrderMarkAsComplete",
	[
		check("order_id")
			.not()
			.isEmpty()
			.withMessage("Order ID is required")
			.isNumeric()
			.withMessage("Order ID must be numeric")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	baristas.BaristaOrderMarkAsComplete
);

console.log("im out of barista router");
module.exports = router;

const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth_middleware");

console.log("im in waiter router");

const waiters = require("../controllers/waiter");
let validation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};

/**
 * @swagger
 * /waiterAssignedTableList:
 *   get:
 *     summary: Get waiter assigned table list
 *     tags: [Waiter]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         required: true
 *         description: Page number
 *     responses:
 *       200:
 *         description: Waiter assigned table list
 *       400:
 *         description: Validation error
 */
router.get(
	"/waiterAssignedTableList",
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
	waiters.waiterAssignedTableList
);

// TODO: New updated waiter routes are not needed as per new flow as of now
// /**
//  * @swagger
//  * /waiterOrderList:
//  *   get:
//  *     summary: Get waiter order list
//  *     tags: [Waiter]
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: Page number
//  *     responses:
//  *       200:
//  *         description: Waiter order list
//  *       400:
//  *         description: Validation error
//  */
// router.get(
// 	"/waiterOrderList",
// 	[
// 		check("page")
// 			.not()
// 			.isEmpty()
// 			.withMessage("page is required")
// 			.trim()
// 			.escape(),
// 	],
// 	validation,
// 	authMiddleware,
// 	waiters.waiterOrderList
// );
// /**
//  * @swagger
//  * /waiterOrderDetails:
//  *   get:
//  *     summary: Get waiter order details
//  *     tags: [Waiter]
//  *     parameters:
//  *       - in: query
//  *         name: order_id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: Order ID
//  *     responses:
//  *       200:
//  *         description: Waiter order details
//  *       400:
//  *         description: Validation error
//  */
// router.get(
// 	"/waiterOrderDetails",
// 	[
// 		check("order_id")
// 			.not()
// 			.isEmpty()
// 			.withMessage("Order ID is required")
// 			.isNumeric()
// 			.withMessage("Order ID not valid")
// 			.trim()
// 			.escape(),
// 	],
// 	validation,
// 	authMiddleware,
// 	waiters.waiterOrderDetails
// );
// /**
//  * @swagger
//  * /waiterOrderAccept:
//  *   put:
//  *     summary: Accept waiter order
//  *     tags: [Waiter]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               order_id:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Order accepted
//  *       400:
//  *         description: Validation error
//  */
// router.put(
// 	"/waiterOrderAccept",
// 	[
// 		check("order_id")
// 			.not()
// 			.isEmpty()
// 			.withMessage("Order ID is required")
// 			.isNumeric()
// 			.withMessage("Order ID not valid")
// 			.trim()
// 			.escape(),
// 	],
// 	validation,
// 	authMiddleware,
// 	waiters.waiterOrderAccept
// );
// /**
//  * @swagger
//  * /waiterOrderComplete:
//  *   put:
//  *     summary: Complete waiter order
//  *     tags: [Waiter]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               order_id:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Order completed
//  *       400:
//  *         description: Validation error
//  */
// router.put(
// 	"/waiterOrderComplete",
// 	[
// 		check("order_id")
// 			.not()
// 			.isEmpty()
// 			.withMessage("Order ID is required")
// 			.isNumeric()
// 			.withMessage("Order ID not valid")
// 			.trim()
// 			.escape(),
// 	],
// 	validation,
// 	authMiddleware,
// 	waiters.waiterOrderComplete
// );

console.log("im out of waiter router");
module.exports = router;

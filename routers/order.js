const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth_middleware");

console.log("im in order router");

const validation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}
	next();
};
const orders = require("../controllers/order");

router.post(
	"/makeorder",
	authMiddleware,
	[
		check("table_id").isInt().withMessage("table_id must be an integer"),
		check("order_type")
			.isIn(["dine_in", "take_away", "delivery"])
			.withMessage("order_type must be one of dine_in, take_away, delivery"),
		check("user_id").isInt().withMessage("user_id must be an integer"),
		check("barista_id")
			.optional({ nullable: true })
			.isInt()
			.withMessage("barista_id must be an integer"),
		check("waiter_id").isInt().withMessage("waiter_id must be an integer"),
	],
	validation,
	orders.MakeOrder
);

/**
 * @swagger
 * /updateorder/{order_id}:
 *   put:
 *     summary: Update an existing order
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         description: The ID of the order to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       description: Order update details are fully dynamic and can include any of the table fields, every field is optional only pass those field with correct value what will you like to update
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               table_id:
 *                 type: integer
 *               order_type:
 *                 type: string
 *                 enum: [dine_in, take_away, delivery]
 *               order_status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *               total_price:
 *                 type: number
 *               bill_status:
 *                 type: string
 *                 enum: [unpaid, paid, refunded]
 *               sub_total:
 *                 type: number
 *               discount:
 *                 type: number
 *               taxes:
 *                 type: number
 *               user_id:
 *                 type: integer
 *               barista_id:
 *                 type: integer
 *               waiter_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put("/updateorder/:order_id", authMiddleware, orders.UpdateOrder);

router.delete("/deleteorder/:order_id", authMiddleware, orders.DeleteOrder);

// Order Items routes
router.post(
	"/makeorderitem",
	authMiddleware,
	[
		check("order_id").isInt().withMessage("order_id must be an integer"),
		check("item_id").isInt().withMessage("item_id must be an integer"),
		check("item_image")
			.optional({ nullable: true })
			.isString()
			.withMessage("item_image must be a string"),
		check("note")
			.optional({ nullable: true })
			.isString()
			.withMessage("note must be a string"),
		check("quantity").isInt().withMessage("quantity must be an integer"),
		check("price").isFloat().withMessage("price must be a number"),
		check("item_name").isString().withMessage("item_name must be a string"),
	],
	validation,
	orders.MakeOrderItem
);

router.put(
	"/updateorderitem/:order_item_id",
	authMiddleware,
	orders.UpdateOrderItem
);

router.delete(
	"/deleteorderitem/:order_item_id",
	authMiddleware,
	orders.DeleteOrderItem
);

// Barista routes
router.put(
	"/barista/order/accept",
	authMiddleware,
	[
		check("order_id").isInt().withMessage("order_id must be an integer"),
		check("orderItem_id")
			.isInt()
			.withMessage("orderItem_id must be an integer"),
		check("barista_id").isInt().withMessage("barista_id must be an integer"),
	],
	validation,
	orders.BaristaOrderAccept
);

router.put(
	"/orderitem/status/:order_item_id",
	authMiddleware,
	[
		check("order_item_status")
			.isIn(["to_do", "in_making", "ready_to_serve", "served", "cancelled"])
			.withMessage(
				"order_item_status must be one of to_do, in_making, ready_to_serve, served, cancelled"
			),
	],
	validation,
	orders.UpdateOrderItem
);

module.exports = router;

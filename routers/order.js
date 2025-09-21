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
		check("order_type")
			.isIn(["dine_in", "take_away", "delivery"])
			.withMessage("order_type must be one of dine_in, take_away, delivery"),
		check("table_id").custom((value, { req }) => {
			if (req.body.order_type === "dine_in") {
				if (value === undefined || value === null || value === "") {
					throw new Error("table_id is required for dine_in orders");
				}
				if (!Number.isInteger(Number(value))) {
					throw new Error("table_id must be an integer");
				}
			} else if (value !== undefined && value !== null && value !== "") {
				if (!Number.isInteger(Number(value))) {
					throw new Error("table_id must be an integer");
				}
			}
			return true;
		}),
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

// Get all the order with appropriate filters and pagination
router.get(
	"/admin/orders/all",
	authMiddleware,
	[
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.trim()
			.escape(),
		check("order_status")
			.optional()
			.isIn(["pending", "in_progress", "complete", "cancelled", "all"])
			.withMessage(
				"order_status must be one of pending, in_progress, complete, cancelled, all"
			),
		check("order_type")
			.optional()
			.isIn(["dine_in", "take_away", "delivery", "all"])
			.withMessage(
				"order_type must be one of dine_in, take_away, delivery, all"
			),
		check("bill_status")
			.optional()
			.isIn(["unpaid", "paid", "refunded", "all"])
			.withMessage("bill_status must be one of unpaid, paid, refunded, all"),
		check("sort_by")
			.optional()
			.isString()
			.withMessage("sort_by must be a string"),
		check("sort_order")
			.optional()
			.isIn(["ASC", "DESC", "asc", "desc"])
			.withMessage("sort_order must be ASC or DESC"),
	],
	validation,
	orders.GetAllOrders
);

// Get all the orders for current logged in waiter
router.get(
	"/waiter/orders/all",
	authMiddleware,
	[
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.trim()
			.escape(),
		check("order_status")
			.optional()
			.isIn(["pending", "in_progress", "completed", "cancelled", "all"])
			.withMessage(
				"order_status must be one of pending, in_progress, completed, cancelled, all"
			),
		check("order_type")
			.optional()
			.isIn(["dine_in", "take_away", "delivery", "all"])
			.withMessage(
				"order_type must be one of dine_in, take_away, delivery, all"
			),
		check("bill_status")
			.optional()
			.isIn(["unpaid", "paid", "refunded", "all"])
			.withMessage("bill_status must be one of unpaid, paid, refunded, all"),
		check("sort_by")
			.optional()
			.isString()
			.withMessage("sort_by must be a string"),
		check("sort_order")
			.optional()
			.isIn(["ASC", "DESC", "asc", "desc"])
			.withMessage("sort_order must be ASC or DESC"),
	],
	validation,
	orders.GetAllCurrentWaiterOrders
);

// Get all the orders for current logged in barista
router.get(
	"/barista/orders/all",
	authMiddleware,
	[
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.trim()
			.escape(),
		check("order_status")
			.optional()
			.isIn(["pending", "in_progress", "completed", "cancelled", "all"])
			.withMessage(
				"order_status must be one of pending, in_progress, completed, cancelled, all"
			),
		check("order_type")
			.optional()
			.isIn(["dine_in", "take_away", "delivery", "all"])
			.withMessage(
				"order_type must be one of dine_in, take_away, delivery, all"
			),
		check("bill_status")
			.optional()
			.isIn(["unpaid", "paid", "refunded", "all"])
			.withMessage("bill_status must be one of unpaid, paid, refunded, all"),
		check("sort_by")
			.optional()
			.isString()
			.withMessage("sort_by must be a string"),
		check("sort_order")
			.optional()
			.isIn(["ASC", "DESC", "asc", "desc"])
			.withMessage("sort_order must be ASC or DESC"),
	],
	validation,
	orders.GetAllCurrentBaristaOrders
);

// Get single order details
router.get("/order/:order_id", authMiddleware, orders.GetOrderDetails);

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

// Access all order_items for barista
router.get("/barista/orderitems", authMiddleware, orders.GetBaristaOrderItems);

// waiter order completed route
router.put(
	"/waiter/order/:order_id/complete",
	authMiddleware,
	[
		check("order_status")
			.isIn(["complete"])
			.withMessage("order_status must be complete"),
	],
	validation,
	orders.WaiterOrderComplete
);

// Get all order based on waiter
// Not in use currently
// router.get("/waiter/orders/all", authMiddleware, orders.GetWaiterOrders);

module.exports = router;

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

/**
 * @swagger
 * /makeorder:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_type
 *               - user_id
 *               - waiter_id
 *             properties:
 *               order_type:
 *                 type: string
 *                 enum: [dine_in, take_away, delivery]
 *               table_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               barista_id:
 *                 type: integer
 *               waiter_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Order created successfully
 *       422:
 *         description: Validation error
 */
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
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order to update
 *     requestBody:
 *       required: true
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

/**
 * @swagger
 * /deleteorder/{order_id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order to delete
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.delete("/deleteorder/:order_id", authMiddleware, orders.DeleteOrder);

/**
 * @swagger
 * /admin/orders/all:
 *   get:
 *     summary: Get all orders with filters and pagination (Admin)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: order_status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, complete, cancelled, all]
 *       - in: query
 *         name: order_type
 *         schema:
 *           type: string
 *           enum: [dine_in, take_away, delivery, all]
 *       - in: query
 *         name: bill_status
 *         schema:
 *           type: string
 *           enum: [unpaid, paid, refunded, all]
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC, asc, desc]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (ISO 8601 format)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       422:
 *         description: Validation error
 */
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
		check("start_date")
			.optional()
			.isISO8601()
			.withMessage("start_date must be a valid ISO 8601 date"),
		check("end_date")
			.optional()
			.isISO8601()
			.withMessage("end_date must be a valid ISO 8601 date"),
	],
	validation,
	orders.GetAllOrders
);

/**
 * @swagger
 * /waiter/orders/all:
 *   get:
 *     summary: Get all orders for the current logged in waiter
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: order_status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled, all]
 *       - in: query
 *         name: order_type
 *         schema:
 *           type: string
 *           enum: [dine_in, take_away, delivery, all]
 *       - in: query
 *         name: bill_status
 *         schema:
 *           type: string
 *           enum: [unpaid, paid, refunded, all]
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC, asc, desc]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (ISO 8601 format)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       422:
 *         description: Validation error
 */
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
		check("start_date")
			.optional()
			.isISO8601()
			.withMessage("start_date must be a valid ISO 8601 date"),
		check("end_date")
			.optional()
			.isISO8601()
			.withMessage("end_date must be a valid ISO 8601 date"),
	],
	validation,
	orders.GetAllCurrentWaiterOrders
);

/**
 * @swagger
 * /orders/status:
 *   get:
 *     summary: Get all orders filtered by order status
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: order_status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled, to_do]
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC, asc, desc]
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       422:
 *         description: Validation error
 */
router.get(
	"/orders/status",
	authMiddleware,
	[
		check("order_status")
			.not()
			.isEmpty()
			.withMessage("order_status is required")
			.isIn(["pending", "in_progress", "completed", "cancelled", "to_do"])
			.withMessage(
				"order_status must be one of pending, in_progress, completed, cancelled, to_do"
			),
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.trim()
			.escape(),
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
	orders.GetAllOrdersWithOrderStatus
);

/**
 * @swagger
 * /barista/orders/all:
 *   get:
 *     summary: Get all orders for the current logged in barista
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: order_status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled, all]
 *       - in: query
 *         name: order_type
 *         schema:
 *           type: string
 *           enum: [dine_in, take_away, delivery, all]
 *       - in: query
 *         name: bill_status
 *         schema:
 *           type: string
 *           enum: [unpaid, paid, refunded, all]
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC, asc, desc]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (ISO 8601 format)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       422:
 *         description: Validation error
 */
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

/**
 * @swagger
 * /order/{order_id}:
 *   get:
 *     summary: Get details of a single order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order
 *     responses:
 *       200:
 *         description: Order details fetched successfully
 *       404:
 *         description: Order not found
 */
router.get("/order/:order_id", authMiddleware, orders.GetOrderDetails);

/**
 * @swagger
 * /makeorderitem:
 *   post:
 *     summary: Add an item to an order
 *     tags: [OrderItem]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - item_id
 *               - quantity
 *               - price
 *               - item_name
 *             properties:
 *               order_id:
 *                 type: integer
 *               item_id:
 *                 type: integer
 *               item_image:
 *                 type: string
 *               note:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               item_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order item created successfully
 *       422:
 *         description: Validation error
 */
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

/**
 * @swagger
 * /updateorderitem/{order_item_id}:
 *   put:
 *     summary: Update an order item
 *     tags: [OrderItem]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_item_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               note:
 *                 type: string
 *               item_image:
 *                 type: string
 *               order_item_status:
 *                 type: string
 *                 enum: [to_do, in_making, ready_to_serve, served, cancelled]
 *     responses:
 *       200:
 *         description: Order item updated successfully
 *       404:
 *         description: Order item not found
 */
router.put(
	"/updateorderitem/:order_item_id",
	authMiddleware,
	orders.UpdateOrderItem
);

/**
 * @swagger
 * /deleteorderitem/{order_item_id}:
 *   delete:
 *     summary: Delete an order item
 *     tags: [OrderItem]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_item_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order item to delete
 *     responses:
 *       200:
 *         description: Order item deleted successfully
 *       404:
 *         description: Order item not found
 */
router.delete(
	"/deleteorderitem/:order_item_id",
	authMiddleware,
	orders.DeleteOrderItem
);

/**
 * @swagger
 * /barista/order/accept:
 *   put:
 *     summary: Barista accepts an order item
 *     tags: [OrderItem]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - orderItem_id
 *               - barista_id
 *             properties:
 *               order_id:
 *                 type: integer
 *               orderItem_id:
 *                 type: integer
 *               barista_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Order item accepted by barista
 *       422:
 *         description: Validation error
 */
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

/**
 * @swagger
 * /orderitem/status/{order_item_id}:
 *   put:
 *     summary: Update status of an order item
 *     tags: [OrderItem]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_item_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_item_status
 *             properties:
 *               order_item_status:
 *                 type: string
 *                 enum: [to_do, in_progress, in_making, ready_to_serve, served, cancelled, complete]
 *     responses:
 *       200:
 *         description: Order item status updated successfully
 *       422:
 *         description: Validation error
 */
router.put(
	"/orderitem/status/:order_item_id",
	authMiddleware,
	[
		check("order_item_status")
			.isIn(["to_do", "in_progress", "in_making", "ready_to_serve", "served", "cancelled", "complete"])
			.withMessage(
				"order_item_status must be one of to_do, in_making, ready_to_serve, served, cancelled"
			),
	],
	validation,
	orders.UpdateOrderItem
);

/**
 * @swagger
 * /barista/orderitems:
 *   get:
 *     summary: Get all order items for barista
 *     tags: [OrderItem]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order items fetched successfully
 */
router.get("/barista/orderitems", authMiddleware, orders.GetBaristaOrderItems);

/**
 * @swagger
 * /waiter/order/{order_id}/complete:
 *   put:
 *     summary: Mark an order as completed by waiter
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_status
 *             properties:
 *               order_status:
 *                 type: string
 *                 enum: [complete]
 *     responses:
 *       200:
 *         description: Order marked as complete
 *       422:
 *         description: Validation error
 */
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

/**
 * @swagger
 * /generatebill:
 *   put:
 *     summary: Generate bill for an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - total_price
 *               - sub_total
 *               - discount
 *               - taxes
 *               - extra_charges
 *             properties:
 *               order_id:
 *                 type: integer
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
 *     responses:
 *       200:
 *         description: Bill generated successfully
 *       422:
 *         description: Validation error
 */
router.put(
	"/generatebill",
	authMiddleware,
	[
		check("order_id").isInt().withMessage("order_id must be an integer"),
		check("total_price").isFloat().withMessage("total_price must be a number"),
		check("sub_total").isFloat().withMessage("sub_total must be a number"),
		check("discount").isFloat().withMessage("discount must be a number"),
		check("taxes").isFloat().withMessage("taxes must be a number"),
		check("extra_charges")
			.isFloat()
			.withMessage("extra_charges must be a number"),
	],
	validation,
	orders.GenerateBill
);

/**
 * @swagger
 * /paybill:
 *   put:
 *     summary: Pay bill for an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - payment_method
 *               - bill_status
 *             properties:
 *               order_id:
 *                 type: integer
 *               payment_method:
 *                 type: string
 *                 enum: [credit_card, debit_card, upi, cash]
 *               bill_status:
 *                 type: string
 *                 enum: [paid, void]
 *     responses:
 *       200:
 *         description: Bill paid successfully
 *       422:
 *         description: Validation error
 */
router.put(
	"/paybill",
	authMiddleware,
	[
		check("order_id").isInt().withMessage("order_id must be an integer"),
		check("payment_method")
			.isIn(["credit_card", "debit_card", "upi", "cash"])
			.withMessage(
				"payment_method must be one of credit_card, debit_card, upi, cash"
			),
		check("bill_status")
			.isIn(["paid", "void"])
			.withMessage("bill_status must be one of paid, void"),
	],
	validation,
	orders.PayBill
);

module.exports = router;

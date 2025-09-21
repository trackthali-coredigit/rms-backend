require("sequelize");
require("dotenv").config();
const { Op, or, where } = require("sequelize");

//Todo: Change Admin and Supervisor to add user also

const MakeOrder = async (req, res) => {
	try {
		console.log("im in make order controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const {
			table_id,
			order_type,
			waiter_id,
			user_id,
			barista_id = null,
		} = req.body;

		console.log(
			"req.userData--------------------------",
			table_id,
			order_type,
			waiter_id,
			user_id,
			barista_id,
			req.userData
		);

		const newOrder = await db.Order.create({
			table_id,
			order_type,
			waiter_id,
			user_id,
			barista_id,
			business_id,
		});

		if (order_type === "dine_in") {
			// Update table status to 'occupied' when a dine-in order is created
			console.log(
				"Dine-in order, updating table status to occupied",
				table_id,
				business_id
			);
			const table = await db.Tables.findOne({
				where: { table_id, business_id },
			});
			console.log("Found table:", table);
			if (!table) {
				return res.status(404).json({ Status: 0, message: "Table Not Found" });
			}

			if (table?.status === "occupied") {
				return res
					.status(400)
					.json({ Status: 0, message: "Table is already occupied" });
			}
			await db.Tables.update(
				{ status: "occupied" },
				{ where: { table_id: table_id, business_id } }
			);
		}

		return res.status(201).json({
			Status: 1,
			message: "Order Created Successfully",
			data: newOrder,
		});
	} catch (error) {
		console.error("Error making order:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const UpdateOrder = async (req, res) => {
	try {
		console.log("im in update order controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const updateFields = { ...req.body, business_id };

		// Remove undefined or null fields to avoid overwriting with null/undefined
		Object.keys(updateFields).forEach(
			(key) => updateFields[key] == null && delete updateFields[key]
		);

		console.log("Updating order with fields:", updateFields, req.userData);

		const [affectedRows] = await db.Order.update(updateFields, {
			where: {
				order_id: req.params.order_id,
			},
		});

		if (affectedRows === 0) {
			return res.status(404).json({ Status: 0, message: "Order Not Found" });
		}

		const updatedOrder = await db.Order.findOne({
			where: { order_id: req.params.order_id },
		});

		return res.status(200).json({
			Status: 1,
			message: "Order Updated Successfully",
			data: updatedOrder,
		});
	} catch (error) {
		console.error("Error updating order:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const DeleteOrder = async (req, res) => {
	try {
		console.log("im in delete order controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		// Proceed with deleting the order
		const { order_id } = req.params;
		const order = await db.Order.findOne({
			where: { order_id, business_id },
		});
		if (!order) {
			return res.status(404).json({ Status: 0, message: "Order Not Found" });
		}

		if (order.order_type === "dine_in") {
			// Update table status to 'available' when a dine-in order is deleted
			console.log(
				"Dine-in order, updating table status to available",
				order.table_id,
				order.business_id
			);
			const table = await db.Tables.findOne({
				where: { table_id: order.table_id, business_id: order.business_id },
			});
			console.log("Found table:", table);
			if (!table) {
				return res.status(404).json({ Status: 0, message: "Table Not Found" });
			}

			await db.Tables.update(
				{ status: "available" },
				{ where: { table_id: order.table_id, business_id } }
			);
		}

		await order.destroy();
		// Delete all order items associated with this order
		await db.Order_Item.destroy({
			where: { order_id, business_id },
		});
		return res
			.status(200)
			.json({ Status: 1, message: "Order Deleted Successfully" });
	} catch (error) {
		console.error("Error deleting order:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const GetAllOrders = async (req, res) => {
	try {
		console.log("im in get all orders controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const { page, order_status, order_type, bill_status, sort_by, sort_order } =
			req.body;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;

		const offset = (currentPage - 1) * pageSize;

		// Build filter
		const where = { business_id };

		if (order_status && order_status !== "all") {
			where.order_status = order_status;
		}
		if (order_type && order_type !== "all") {
			where.order_type = order_type;
		}
		if (bill_status && bill_status !== "all") {
			where.bill_status = bill_status;
		}

		// Sorting
		let order = [["updatedAt", "DESC"]];
		if (sort_by) {
			const validSortOrder =
				sort_order && ["ASC", "DESC"].includes(sort_order.toUpperCase())
					? sort_order.toUpperCase()
					: "DESC";
			order = [[sort_by, validSortOrder]];
		}

		const { count, rows } = await db.Order.findAndCountAll({
			where,
			include: [
				{
					model: db.Order_Item,
					as: "order_items_models",
					required: false,
					include: [
						{
							model: db.User,
							attributes: ["user_id", "first_name", "last_name", "role"],
							required: false,
						},
					],
				},
				{
					model: db.User,
					attributes: ["user_id", "role", "first_name", "last_name"],
					required: false,
				},
				{
					model: db.Waiter,
					attributes: ["id", "user_id"],
					required: false,
					include: [
						{
							model: db.User,
							as: "users_model",
							attributes: ["user_id", "first_name", "last_name", "role"],
							required: false,
						},
					],
				},
				{
					model: db.Business,
					attributes: ["business_id", "business_name", "tax"],
					required: false,
				},
			],
			distinct: true,
			limit: pageSize,
			offset,
			order,
		});

		// Fetch ingrediant data for each order item (if ingrediant_id is comma separated)
		for (const order of rows) {
			if (order.order_items_models && Array.isArray(order.order_items_models)) {
				for (const item of order.order_items_models) {
					if (item.ingrediant_id) {
						const ingrediantIds = item.ingrediant_id
							.split(",")
							.map((id) => id.trim())
							.filter((id) => id);
						if (ingrediantIds.length > 0) {
							item.dataValues.ingrediant_models = await db.Ingrediant.findAll({
								where: { ingrediant_id: ingrediantIds },
								attributes: ["ingrediant_id", "name", "price"],
							});
						} else {
							item.dataValues.ingrediant_models = [];
						}
					} else {
						item.dataValues.ingrediant_models = [];
					}
				}
			}
		}
		const totalPages = Math.ceil(count / pageSize);

		return res.status(200).json({
			Status: 1,
			message: "Order list fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			orders: rows,
			total: count,
		});
	} catch (error) {
		console.error("Error getting all orders:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const GetAllCurrentWaiterOrders = async (req, res) => {
	try {
		console.log("im in get all current waiter orders controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const { page, order_status, order_type, bill_status, sort_by, sort_order } =
			req.body;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		// Build filter (same as GetAllOrders)
		const where = { business_id };
		if (order_status && order_status !== "all") {
			where.order_status = order_status;
		}
		if (order_type && order_type !== "all") {
			where.order_type = order_type;
		}
		if (bill_status && bill_status !== "all") {
			where.bill_status = bill_status;
		}

		// Sorting
		let order = [["updatedAt", "DESC"]];
		if (sort_by) {
			const validSortOrder =
				sort_order && ["ASC", "DESC"].includes(sort_order.toUpperCase())
					? sort_order.toUpperCase()
					: "DESC";
			order = [[sort_by, validSortOrder]];
		}

		const { count, rows } = await db.Order.findAndCountAll({
			where,
			include: [
				{
					model: db.Waiter,
					as: "waiter_model",
					attributes: ["id", "user_id"],
					required: true,
					where: { user_id: current_user_id },
					include: [
						{
							model: db.User,
							as: "users_model",
							attributes: ["user_id", "first_name", "last_name", "role"],
							required: false,
						},
					],
				},
				{
					model: db.Order_Item,
					as: "order_items_models",
					required: false,
					include: [
						{
							model: db.User,
							attributes: ["user_id", "first_name", "last_name", "role"],
							required: false,
						},
					],
				},
				{
					model: db.User,
					attributes: ["user_id", "role", "first_name", "last_name"],
					required: false,
				},
				{
					model: db.Business,
					attributes: ["business_id", "business_name", "tax"],
					required: false,
				},
			],
			limit: pageSize,
			offset,
			order,
			distinct: true,
		});

		// Fetch ingrediant data for each order item (if ingrediant_id is comma separated)
		for (const order of rows) {
			if (order.order_items_models && Array.isArray(order.order_items_models)) {
				for (const item of order.order_items_models) {
					if (item.ingrediant_id) {
						const ingrediantIds = item.ingrediant_id
							.split(",")
							.map((id) => id.trim())
							.filter((id) => id);
						if (ingrediantIds.length > 0) {
							item.dataValues.ingrediant_models = await db.Ingrediant.findAll({
								where: { ingrediant_id: ingrediantIds },
								attributes: ["ingrediant_id", "name", "price"],
							});
						} else {
							item.dataValues.ingrediant_models = [];
						}
					} else {
						item.dataValues.ingrediant_models = [];
					}
				}
			}
		}
		const totalPages = Math.ceil(count / pageSize);
		return res.status(200).json({
			Status: 1,
			message: "Current Waiter Orders fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			orders: rows,
			total: count,
		});
	} catch (error) {
		console.error("Error getting current waiter orders:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const GetAllCurrentBaristaOrders = async (req, res) => {
	try {
		console.log("im in get all current barista orders controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "barista" }, { role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const { page, order_status, order_type, bill_status, sort_by, sort_order } =
			req.body;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		// Build filter
		const where = { business_id };
		if (order_status && order_status !== "all") {
			where.order_status = order_status;
		}
		if (order_type && order_type !== "all") {
			where.order_type = order_type;
		}
		if (bill_status && bill_status !== "all") {
			where.bill_status = bill_status;
		}

		// Sorting
		let order = [["updatedAt", "DESC"]];
		if (sort_by) {
			const validSortOrder =
				sort_order && ["ASC", "DESC"].includes(sort_order.toUpperCase())
					? sort_order.toUpperCase()
					: "DESC";
			order = [[sort_by, validSortOrder]];
		}

		const { count, rows } = await db.Order.findAndCountAll({
			where,
			include: [
				{
					model: db.Order_Item,
					as: "order_items_models",
					required: true,
					where: { barista_id: current_user_id },
					include: [
						{
							model: db.User,
							attributes: ["user_id", "first_name", "last_name", "role"],
							required: false,
						},
					],
				},
				{
					model: db.User,
					attributes: ["user_id", "role", "first_name", "last_name"],
					required: false,
				},
				{
					model: db.Business,
					attributes: ["business_id", "business_name", "tax"],
					required: false,
				},
				{
					model: db.Waiter,
					as: "waiter_model",
					attributes: ["id", "user_id"],
					required: false,
					include: [
						{
							model: db.User,
							as: "users_model",
							attributes: ["user_id", "first_name", "last_name", "role"],
							required: false,
						},
					],
				},
			],
			limit: pageSize,
			offset,
			order,
			distinct: true,
		});

		// Fetch ingrediant data for each order item (if ingrediant_id is comma separated)
		for (const order of rows) {
			if (order.order_items_models && Array.isArray(order.order_items_models)) {
				for (const item of order.order_items_models) {
					if (item.ingrediant_id) {
						const ingrediantIds = item.ingrediant_id
							.split(",")
							.map((id) => id.trim())
							.filter((id) => id);
						if (ingrediantIds.length > 0) {
							item.dataValues.ingrediant_models = await db.Ingrediant.findAll({
								where: { ingrediant_id: ingrediantIds },
								attributes: ["ingrediant_id", "name", "price"],
							});
						} else {
							item.dataValues.ingrediant_models = [];
						}
					} else {
						item.dataValues.ingrediant_models = [];
					}
				}
			}
		}
		const totalPages = Math.ceil(count / pageSize);
		return res.status(200).json({
			Status: 1,
			message: "Current Barista Orders fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			orders: rows,
			total: count,
		});
	} catch (error) {
		console.error("Error getting current barista orders:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const MakeOrderItem = async (req, res) => {
	try {
		console.log("im in make order item controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const {
			order_id,
			item_id,
			order_item_status,
			item_image,
			note,
			quantity,
			price,
			item_name,
			ingrediant_id,
		} = req.body;

		console.log(
			"req.userData--------------------------",
			order_id,
			item_id,
			order_item_status,
			item_image,
			note,
			quantity,
			price,
			item_name,
			req.userData
		);
		const newOrderItem = await db.Order_Item.create({
			business_id,
			order_id,
			item_id,
			order_item_status,
			item_image,
			note,
			quantity,
			price,
			item_name,
			ingrediant_id,
		});
		console.log("New Order Item Created:", newOrderItem);

		return res.status(201).json({
			Status: 1,
			message: "Order Item Created Successfully",
			data: newOrderItem,
		});
	} catch (error) {
		console.error("Error making order item:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const UpdateOrderItem = async (req, res) => {
	try {
		console.log("im in update order item controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const updateFields = { ...req.body, business_id };
		// Remove undefined or null fields to avoid overwriting with null/undefined
		Object.keys(updateFields).forEach(
			(key) => updateFields[key] == null && delete updateFields[key]
		);
		console.log("Updating order item with fields:", updateFields, req.userData);
		const [affectedRows] = await db.Order_Item.update(updateFields, {
			where: {
				orderItem_id: req.params.order_item_id,
			},
		});
		if (affectedRows === 0) {
			return res
				.status(404)
				.json({ Status: 0, message: "Order Item Not Found" });
		}
		const updatedOrderItem = await db.Order_Item.findOne({
			where: { orderItem_id: req.params.order_item_id },
		});
		return res.status(200).json({
			Status: 1,
			message: "Order Item Updated Successfully",
			data: updatedOrderItem,
		});
	} catch (error) {
		console.error("Error updating order item:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const DeleteOrderItem = async (req, res) => {
	try {
		console.log("im in delete order item controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		// Proceed with deleting the order item
		const { order_item_id } = req.params;
		const orderItem = await db.Order_Item.findOne({
			where: { orderItem_id: order_item_id, business_id },
		});
		if (!orderItem) {
			return res
				.status(404)
				.json({ Status: 0, message: "Order Item Not Found" });
		}
		await orderItem.destroy();
		return res
			.status(200)
			.json({ Status: 1, message: "Order Item Deleted Successfully" });
	} catch (error) {
		console.error("Error deleting order item:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

// Barista accepts an order
const BaristaOrderAccept = async (req, res) => {
	try {
		console.log("im in barista accept order controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					//Todo: currently only barista and admin can accept order
					{ [Op.or]: [{ role: "barista" }, { role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res
				.status(404)
				.json({ Status: 0, message: "The User Not Found or Not a Barista" });
		}
		// Proceed with accepting the order
		const { order_id, orderItem_id, barista_id } = req.body;
		const order = await db.Order.findOne({ where: { order_id, business_id } });
		if (!order) {
			return res.status(404).json({ Status: 0, message: "Order Not Found" });
		}
		order.order_status = "in_progress";

		if (orderItem_id) {
			const orderItem = await db.Order_Item.findOne({
				where: { orderItem_id, order_id, business_id },
			});
			if (!orderItem) {
				return res
					.status(404)
					.json({ Status: 0, message: "Order Item Not Found" });
			}
			orderItem.order_item_status = "in_making";
			orderItem.barista_id = barista_id;

			await orderItem.save();
			await order.save();
		}
		return res
			.status(200)
			.json({ Status: 1, message: "Order Accepted by Barista Successfully" });
	} catch (error) {
		console.error("Error accepting order:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const GetBaristaOrderItems = async (req, res) => {
	try {
		console.log("im in get barista order items controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "barista" }, { role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const { page } = req.body;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		const where = {
			business_id,
			order_item_status: { [Op.notIn]: ["served", "cancelled"] },
		};
		const { count, rows } = await db.Order_Item.findAndCountAll({
			where,
			include: [
				{
					model: db.User,
					attributes: ["user_id", "first_name", "last_name", "role"],
					required: false,
				},
			],
			distinct: true,
			limit: pageSize,
			offset,
			order: [["updatedAt", "DESC"]],
		});
		const totalPages = Math.ceil(count / pageSize);
		return res.status(200).json({
			Status: 1,
			message: "Barista Order items fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			order_items: rows,
			total: count,
		});
	} catch (error) {
		console.error("Error getting barista order items:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

// Waiter marks order complete and appropriate order items as served
const WaiterOrderComplete = async (req, res) => {
	try {
		console.log("im in waiter complete order controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		// Proceed with marking the order as complete
		const { order_id } = req.params;
		const { order_status } = req.body;
		const order = await db.Order.findOne({ where: { order_id, business_id } });
		if (!order) {
			return res.status(404).json({ Status: 0, message: "Order Not Found" });
		}
		if (order_status !== "complete") {
			return res
				.status(400)
				.json({ Status: 0, message: "Invalid order status update" });
		}
		order.order_status = "complete";
		// Update all associated order items to 'served' if they are not cancelled
		await db.Order_Item.update(
			{ order_item_status: "served" },
			{ where: { order_id, order_item_status: { [Op.ne]: "cancelled" } } }
		);
		await order.save();
		return res
			.status(200)
			.json({ Status: 1, message: "Order Marked as Complete Successfully" });
	} catch (error) {
		console.error("Error completing order:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

// Get all orders for the current loggedin waiter
// Not in use currently
const GetWaiterOrders = async (req, res) => {
	try {
		console.log("im in get waiter orders controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const { page } = req.body;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		const where = { business_id };

		const { count, rows } = await db.Order.findAndCountAll({
			where,
			include: [
				{
					model: db.Waiter,
					as: "waiter_model",
					attributes: ["id", "user_id"],
					required: true,
					where: { user_id: current_user_id },
				},
				{
					model: db.Order_Item,
					required: false,
				},
			],
			limit: pageSize,
			offset,
			order: [["updatedAt", "DESC"]],
		});

		const totalPages = Math.ceil(count / pageSize);

		return res.status(200).json({
			Status: 1,
			message: "Waiter Orders fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			orders: rows,
			total: rows.length,
			current_user_id,
		});
	} catch (error) {
		console.error("Error getting waiter orders:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

module.exports = {
	MakeOrder,
	UpdateOrder,
	DeleteOrder,
	GetAllOrders,
	GetAllCurrentWaiterOrders,
	GetAllCurrentBaristaOrders,
	MakeOrderItem,
	UpdateOrderItem,
	DeleteOrderItem,
	BaristaOrderAccept,
	GetBaristaOrderItems,
	WaiterOrderComplete,
	// GetWaiterOrders,
};

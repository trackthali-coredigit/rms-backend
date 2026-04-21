require("sequelize");
require("dotenv").config();
const { Op, or, where } = require("sequelize");
const { emitToSockets } = require("../config/socketConfig");

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
			return res.status(404).json({ Status: 0, status_code: 404, message: "The User Not Found" });
		}

		const {
			table_id,
			order_type,
			waiter_id,
			user_id,
			barista_id = null,
		} = req.body;

		// Validate that user_id exists
		const orderUser = await db.User.findOne({ where: { user_id } });
		if (!orderUser) {
			return res.status(404).json({ Status: 0, status_code: 404, message: "User not found" });
		}

		// Validate that waiter_id exists if provided
		let waiterId = null;
		if (waiter_id) {
			const waiter = await db.Waiter.findOne({ where: { user_id: waiter_id } });
			if (!waiter) {
				return res.status(404).json({ Status: 0, status_code: 404, message: "Waiter not found" });
			}
			waiterId = waiter.id;
		}

		// Validate that barista_id exists if provided
		if (barista_id) {
			const barista = await db.User.findOne({ where: { user_id: barista_id, role: "barista" } });
			if (!barista) {
				return res.status(404).json({ Status: 0, status_code: 404, message: "Barista not found" });
			}
		}

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
			waiter_id: waiterId,
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
				return res.status(404).json({ Status: 0, status_code: 404, message: "Table Not Found" });
			}

			if (table?.status === "occupied") {
				return res.status(400).json({ Status: 0, status_code: 400, message: "Table is already occupied" });
			}
			await db.Tables.update(
				{ status: "occupied" },
				{ where: { table_id: table_id, business_id } }
			);
		}

		// Emit socket event for new order
		try {
			await emitToSockets(user_id, "order_created", { order: newOrder });
			if (waiter_id)
				await emitToSockets(waiter_id, "order_created", { order: newOrder });
			if (barista_id)
				await emitToSockets(barista_id, "order_created", { order: newOrder });
		} catch (e) {
			console.error("Socket emit error (MakeOrder):", e);
		}
		return res.status(200).json({
			Status: 1,
			status_code: 200,
			message: "Order Created Successfully",
			data: newOrder,
		});
	} catch (error) {
		console.error("Error making order:", error);
		res.status(500).json({ Status: 0, status_code: 500, message: "Internal Server Error" });
	}
};

const UpdateOrder = async (req, res) => {
	try {
		console.log("im in update order controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const order_id = req.params.order_id;

		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "waiter" }, { role: "admin" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, status_code: 404, message: "The User Not Found" });
		}

		// Validate order exists and belongs to user's business
		const order = await db.Order.findOne({
			where: {
				order_id: order_id,
				business_id: business_id,
			},
		});

		if (!order) {
			return res.status(404).json({ Status: 0, status_code: 404, message: "Order Not Found or does not belong to your business" });
		}

		const updateFields = { ...req.body };

		// Remove undefined or null fields to avoid overwriting with null/undefined
		Object.keys(updateFields).forEach(
			(key) => updateFields[key] == null && delete updateFields[key]
		);

		// Validate foreign key references before updating
		if (updateFields.waiter_id) {
			// First try to find waiter by id (from tbl_waiter.id)
			let waiter = await db.Waiter.findOne({
				where: { id: updateFields.waiter_id }
			});

			// If not found by id, try to find by user_id (user_id provided instead of waiter.id)
			if (!waiter) {
				waiter = await db.Waiter.findOne({
					where: { user_id: updateFields.waiter_id }
				});

				// If found by user_id, use the waiter's actual id
				if (waiter) {
					updateFields.waiter_id = waiter.id;
				}
			}

			// If still not found, return error
			if (!waiter) {
				return res.status(404).json({
					Status: 0,
					status_code: 404,
					message: `Waiter with id or user_id ${updateFields.waiter_id} not found. Please provide valid waiter id or user_id of a waiter.`
				});
			}
		}

		if (updateFields.barista_id) {
			const barista = await db.User.findOne({
				where: {
					user_id: updateFields.barista_id,
					role: "barista"
				}
			});
			if (!barista) {
				return res.status(404).json({
					Status: 0,
					status_code: 404,
					message: `Barista with id ${updateFields.barista_id} not found`
				});
			}
		}

		if (updateFields.table_id) {
			const table = await db.Tables.findOne({
				where: {
					table_id: updateFields.table_id,
					business_id: business_id
				}
			});
			if (!table) {
				return res.status(404).json({
					Status: 0,
					status_code: 404,
					message: `Table with id ${updateFields.table_id} not found in your business`
				});
			}
		}

		if (updateFields.user_id) {
			const orderUser = await db.User.findOne({
				where: { user_id: updateFields.user_id }
			});
			if (!orderUser) {
				return res.status(404).json({
					Status: 0,
					status_code: 404,
					message: `User with id ${updateFields.user_id} not found`
				});
			}
		}

		console.log("Updating order with fields:", updateFields, req.userData);

		const [affectedRows] = await db.Order.update(updateFields, {
			where: {
				order_id: order_id,
				business_id: business_id,
			},
		});

		if (affectedRows === 0) {
			return res.status(404).json({ Status: 0, status_code: 404, message: "Order could not be updated" });
		}

		const updatedOrder = await db.Order.findOne({
			where: {
				order_id: order_id,
				business_id: business_id,
			},
		});

		// Emit socket event for order update
		try {
			await emitToSockets(current_user_id, "order_updated", {
				order: updatedOrder,
			});
		} catch (e) {
			console.error("Socket emit error (UpdateOrder):", e);
		}
		return res.status(200).json({
			Status: 1,
			status_code: 200,
			message: "Order Updated Successfully",
			data: updatedOrder,
		});
	} catch (error) {
		console.error("Error updating order:", error);
		res.status(500).json({ Status: 0, status_code: 500, message: "Internal Server Error" });
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
			return res.status(404).json({ Status: 0, status_code: 404, message: "The User Not Found" });
		}
		// Proceed with deleting the order
		const { order_id } = req.params;
		const order = await db.Order.findOne({
			where: { order_id, business_id },
		});
		if (!order) {
			return res.status(404).json({ Status: 0, status_code: 404, message: "Order Not Found" });
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
				return res.status(404).json({ Status: 0, status_code: 404, message: "Table Not Found" });
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
		// Emit socket event for order deletion
		try {
			await emitToSockets(current_user_id, "order_deleted", { order_id });
		} catch (e) {
			console.error("Socket emit error (DeleteOrder):", e);
		}
		return res.status(200).json({ Status: 1, status_code: 200, message: "Order Deleted Successfully" });
	} catch (error) {
		console.error("Error deleting order:", error);
		res.status(500).json({ Status: 0, status_code: 500, message: "Internal Server Error" });
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

		// Fetch data for each order item
		for (const order of rows) {
			if (order.order_items_models && Array.isArray(order.order_items_models)) {
				for (const item of order.order_items_models) {
					// Fetch item details (name and image)
					if (item.item_id) {
						const itemData = await db.Items.findOne({
							where: { item_id: item.item_id, is_deleted: false },
							attributes: ["item_id", "item_name"],
						});
						if (itemData) {
							item.dataValues.item_name = itemData.item_name;
							const itemImage = await db.Item_Img.findOne({
								where: { item_id: item.item_id, is_deleted: false },
								attributes: ["image"],
							});
							item.dataValues.image = itemImage ? itemImage.image : null;
						}
					}
					// Fetch ingrediant data
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
		const { page, order_status, order_type, bill_status, sort_by = "updatedAt", sort_order = "DESC", start_date, end_date } = req.query;
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

		// Add date range filtering (UTC format)
		if (start_date || end_date) {
			where.createdAt = {};
			if (start_date) {
				const startOfDay = new Date(start_date);
				startOfDay.setUTCHours(0, 0, 0, 0);
				where.createdAt[Op.gte] = startOfDay;
			}
			if (end_date) {
				const endOfDay = new Date(end_date);
				endOfDay.setUTCHours(23, 59, 59, 999);
				where.createdAt[Op.lte] = endOfDay;
			}
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

		// Fetch data for each order item
		for (const order of rows) {
			if (order.order_items_models && Array.isArray(order.order_items_models)) {
				for (const item of order.order_items_models) {
					// Fetch item details (name and image)
					if (item.item_id) {
						const itemData = await db.Items.findOne({
							where: { item_id: item.item_id, is_deleted: false },
							attributes: ["item_id", "item_name"],
						});
						if (itemData) {
							item.dataValues.item_name = itemData.item_name;
							const itemImage = await db.Item_Img.findOne({
								where: { item_id: item.item_id, is_deleted: false },
								attributes: ["image"],
							});
							item.dataValues.image = itemImage ? itemImage.image : null;
						}
					}
					// Fetch ingrediant data
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

const GetOrderDetails = async (req, res) => {
	try {
		console.log("im in get order details controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					// { [Op.or]: [{ role: "waiter" }, { role: "admin" }, { role: "barista" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, status_code: 404, message: "The User Not Found" });
		}
		const { order_id } = req.params;
		const order = await db.Order.findOne({
			where: { order_id, business_id },
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
		});
		if (!order) {
			return res.status(404).json({ Status: 0, status_code: 404, message: "Order Not Found" });
		}
		// Fetch data for each order item
		if (order.order_items_models && Array.isArray(order.order_items_models)) {
			for (const item of order.order_items_models) {
				// Fetch item details (name and image)
				if (item.item_id) {
					const itemData = await db.Items.findOne({
						where: { item_id: item.item_id, is_deleted: false },
						attributes: ["item_id", "item_name"],
					});
					if (itemData) {
						item.dataValues.item_name = itemData.item_name;
						const itemImage = await db.Item_Img.findOne({
							where: { item_id: item.item_id, is_deleted: false },
							attributes: ["image"],
						});
						item.dataValues.image = itemImage ? itemImage.image : null;
					}
				}
				// Fetch ingrediant data
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

		return res.status(200).json({
			Status: 1, status_code: 200,
			message: "Order details fetched successfully",
			data: order,
		});
	} catch (error) {
		console.error("Error getting order details:", error);
		res.status(500).json({ Status: 0, status_code: 500, message: "Internal Server Error" });
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

		// Fetch data for each order item
		for (const order of rows) {
			if (order.order_items_models && Array.isArray(order.order_items_models)) {
				for (const item of order.order_items_models) {
					// Fetch item details (name and image)
					if (item.item_id) {
						const itemData = await db.Items.findOne({
							where: { item_id: item.item_id, is_deleted: false },
							attributes: ["item_id", "item_name"],
						});
						if (itemData) {
							item.dataValues.item_name = itemData.item_name;
							const itemImage = await db.Item_Img.findOne({
								where: { item_id: item.item_id, is_deleted: false },
								attributes: ["image"],
							});
							item.dataValues.image = itemImage ? itemImage.image : null;
						}
					}
					// Fetch ingrediant data
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

const GetAllOrdersWithOrderStatus = async (req, res) => {
	try {
		console.log("im in get all orders with status controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ business_id },
					{
						[Op.or]: [
							{ role: "waiter" },
							{ role: "admin" },
							{ role: "barista" },
							{ role: "supervisor" },
						],
					},
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const { page, sort_by, sort_order, order_status = "to_do" } = req.body;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		// Sorting
		let order = [["updatedAt", "DESC"]];
		if (sort_by) {
			const validSortOrder =
				sort_order && ["ASC", "DESC"].includes(sort_order.toUpperCase())
					? sort_order.toUpperCase()
					: "DESC";
			order = [[sort_by, validSortOrder]];
		}

		const where = {
			business_id,
			order_status,
		};

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

		// Fetch data for each order item
		for (const order of rows) {
			if (order.order_items_models && Array.isArray(order.order_items_models)) {
				for (const item of order.order_items_models) {
					// Fetch item details (name and image)
					if (item.item_id) {
						const itemData = await db.Items.findOne({
							where: { item_id: item.item_id, is_deleted: false },
							attributes: ["item_id", "item_name"],
						});
						if (itemData) {
							item.dataValues.item_name = itemData.item_name;
							const itemImage = await db.Item_Img.findOne({
								where: { item_id: item.item_id, is_deleted: false },
								attributes: ["image"],
							});
							item.dataValues.image = itemImage ? itemImage.image : null;
						}
					}
					// Fetch ingrediant data
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

		if (!rows || rows.length === 0) {
			return res
				.status(404)
				.json({ Status: 0, message: "No To-Do Orders Found" });
		}
		return res.status(200).json({
			Status: 1,
			message: "To-Do Orders fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			orders: rows,
			total: count,
		});
	} catch (error) {
		console.error("Error getting to-do orders:", error);
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
			return res.status(404).json({ Status: 0, status_code: 404, message: "The User Not Found" });
		}
		const { order_id, items } = req.body;

		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ Status: 0, status_code: 400, message: "Items array is required and cannot be empty" });
		}

		// Check if the order exists
		const order = await db.Order.findOne({
			where: { order_id, business_id },
		});
		if (!order) {
			return res.status(404).json({ Status: 0, status_code: 404, message: "Order Not Found" });
		}

		console.log("req.userData--------------------------", order_id, items, req.userData);

		const createdItems = [];
		for (const item of items) {
			const {
				item_id,
				note,
				quantity,
				price,
				ingrediant_id,
			} = item;

			// Check if the item exists and fetch item details
			const itemExists = await db.Items.findOne({
				where: { item_id, business_id, is_deleted: false },
				attributes: ['item_id', 'item_name', 'discount']
			});
			if (!itemExists) {
				return res.status(404).json({ Status: 0, status_code: 404, message: `Item with id ${item_id} not found` });
			}

			const newOrderItem = await db.Order_Item.create({
				business_id,
				order_id,
				item_id,
				note,
				quantity,
				price,
				ingrediant_id,
			});

			// Add item details to the response
			newOrderItem.dataValues.item_name = itemExists.item_name;

			// Fetch item image from separate Item_Img table
			const itemImage = await db.Item_Img.findOne({
				where: { item_id, is_deleted: false },
				attributes: ['image']
			});
			newOrderItem.dataValues.image = itemImage ? itemImage.image : null;

			createdItems.push(newOrderItem);
		}
		console.log("New Order Items Created:", createdItems);

		// Get all order items for this order
		const orderItems = await db.Order_Item.findAll({
			where: { order_id, business_id },
		});

		// Calculate Sub Total and Discount based on item discount
		let sub_total = 0;
		let discount = 0;
		for (const item of orderItems) {
			const itemTotal = Number(item.price) * Number(item.quantity);
			sub_total += itemTotal;
			// Fetch item discount from tbl_item (items.js model)
			let itemDiscount = 0;
			if (item.item_id) {
				const itemData = await db.Items.findOne({ where: { item_id: item.item_id, business_id, is_deleted: false } });
				if (itemData && itemData.discount && !isNaN(itemData.discount)) {
					// If discount is a percentage (e.g., 10 for 10%), treat as percent
					// If discount is a fixed value, treat as fixed
					// Here, assume discount is a fixed value per item (as per your model)
					itemDiscount = Number(itemData.discount) || 0;
				}
			}
			// Apply item discount per quantity
			discount += itemDiscount * Number(item.quantity);
		}

		// Fetch tax percentage from tbl_business
		const business = await db.Business.findOne({ where: { business_id } });
		let taxPercent = 0.18; // Default
		if (business && business.tax) {
			taxPercent = Number(business.tax) / 100;
		}

		// Calculate Tax
		const taxable_amount = sub_total - discount;
		const taxes = taxable_amount * taxPercent;

		// Final Total
		const total_price = taxable_amount + taxes;

		// Update Order Table
		await db.Order.update(
			{
				sub_total: sub_total,
				discount: discount,
				taxes: taxes,
				total_price: total_price,
			},
			{
				where: { order_id, business_id },
			}
		);

		// Emit socket event for new order items
		try {
			await emitToSockets(current_user_id, "order_items_created", {
				order_items: createdItems,
			});
		} catch (e) {
			console.error("Socket emit error (MakeOrderItem):", e);
		}
		return res.status(200).json({
			Status: 1,
			status_code: 200,
			message: "Order Items Created Successfully",
			data: createdItems,
		});
	} catch (error) {
		console.error("Error making order item:", error);
		res.status(500).json({ Status: 0, status_code: 500, message: "Internal Server Error" });
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

		// Check if updating multiple items or single item
		const { items, order_id } = req.body;
		const isBatchUpdate = Array.isArray(items) && items.length > 0;

		if (isBatchUpdate) {
			// Batch update multiple items
			console.log("Batch updating order items:", items.length, "items");

			// Validate order exists
			if (!order_id) {
				return res.status(400).json({ Status: 0, status_code: 400, message: "order_id is required for batch updates" });
			}

			const order = await db.Order.findOne({
				where: { order_id, business_id },
			});
			if (!order) {
				return res.status(404).json({ Status: 0, status_code: 404, message: "Order Not Found" });
			}

			const updatedItems = [];
			for (const item of items) {
				const { orderItem_id, quantity, note, order_item_status, price } = item;

				if (!orderItem_id) {
					return res.status(400).json({ Status: 0, status_code: 400, message: "orderItem_id is required for each item" });
				}

				const updateFields = {};
				if (quantity !== undefined && quantity !== null) updateFields.quantity = quantity;
				if (note !== undefined && note !== null) updateFields.note = note;
				if (order_item_status !== undefined && order_item_status !== null) updateFields.order_item_status = order_item_status;
				if (price !== undefined && price !== null) updateFields.price = price;

				const [affectedRows] = await db.Order_Item.update(updateFields, {
					where: {
						orderItem_id,
						business_id,
						order_id,
					},
				});

				if (affectedRows === 0) {
					return res.status(404).json({ Status: 0, status_code: 404, message: `Order Item with id ${orderItem_id} not found` });
				}

				const updatedOrderItem = await db.Order_Item.findOne({
					where: { orderItem_id },
				});

				// Fetch item details (image and name) from Items and Item_Img table
				if (updatedOrderItem && updatedOrderItem.item_id) {
					const itemDetails = await db.Items.findOne({
						where: { item_id: updatedOrderItem.item_id, business_id, is_deleted: false },
						attributes: ['item_id', 'item_name']
					});
					if (itemDetails) {
						updatedOrderItem.dataValues.item_name = itemDetails.item_name;

						// Fetch item image from separate Item_Img table
						const itemImage = await db.Item_Img.findOne({
							where: { item_id: updatedOrderItem.item_id, is_deleted: false },
							attributes: ['image']
						});
						updatedOrderItem.dataValues.image = itemImage ? itemImage.image : null;
					}
				}

				updatedItems.push(updatedOrderItem);
			}

			// Recalculate order totals after batch update
			const orderItems = await db.Order_Item.findAll({
				where: { order_id, business_id },
			});

			let sub_total = 0;
			let discount = 0;
			for (const item of orderItems) {
				const itemTotal = Number(item.price) * Number(item.quantity);
				sub_total += itemTotal;

				let itemDiscount = 0;
				if (item.item_id) {
					const itemData = await db.Items.findOne({ where: { item_id: item.item_id, business_id, is_deleted: false } });
					if (itemData && itemData.discount && !isNaN(itemData.discount)) {
						itemDiscount = Number(itemData.discount) || 0;
					}
				}
				discount += itemDiscount * Number(item.quantity);
			}

			const business = await db.Business.findOne({ where: { business_id } });
			let taxPercent = 0.18;
			if (business && business.tax) {
				taxPercent = Number(business.tax) / 100;
			}

			const taxable_amount = sub_total - discount;
			const taxes = taxable_amount * taxPercent;
			const total_price = taxable_amount + taxes;

			await db.Order.update(
				{
					sub_total: sub_total,
					discount: discount,
					taxes: taxes,
					total_price: total_price,
				},
				{
					where: { order_id, business_id },
				}
			);

			// Emit socket event for batch order items update
			try {
				await emitToSockets(current_user_id, "order_items_updated", {
					order_items: updatedItems,
				});
			} catch (e) {
				console.error("Socket emit error (UpdateOrderItem - Batch):", e);
			}

			return res.status(200).json({
				Status: 1,
				status_code: 200,
				message: "Order Items Updated Successfully",
				data: updatedItems,
			});
		} else {
			// Single item update (backward compatibility)
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

			// Fetch item details (image and name) from Items and Item_Img table
			if (updatedOrderItem && updatedOrderItem.item_id) {
				const itemDetails = await db.Items.findOne({
					where: { item_id: updatedOrderItem.item_id, business_id, is_deleted: false },
					attributes: ['item_id', 'item_name']
				});
				if (itemDetails) {
					updatedOrderItem.dataValues.item_name = itemDetails.item_name;

					// Fetch item image from separate Item_Img table
					const itemImage = await db.Item_Img.findOne({
						where: { item_id: updatedOrderItem.item_id, is_deleted: false },
						attributes: ['image']
					});
					updatedOrderItem.dataValues.image = itemImage ? itemImage.image : null;
				}
			}

			// Emit socket event for order item update
			try {
				await emitToSockets(current_user_id, "order_item_updated", {
					order_item: updatedOrderItem,
				});
			} catch (e) {
				console.error("Socket emit error (UpdateOrderItem):", e);
			}
			return res.status(200).json({
				Status: 1,
				message: "Order Item Updated Successfully",
				data: updatedOrderItem,
			});
		}
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
		// Emit socket event for order item deletion
		try {
			await emitToSockets(current_user_id, "order_item_deleted", {
				order_item_id,
			});
		} catch (e) {
			console.error("Socket emit error (DeleteOrderItem):", e);
		}
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
		// Emit socket event for barista order accept
		try {
			await emitToSockets(current_user_id, "barista_order_accepted", {
				order_id,
			});
		} catch (e) {
			console.error("Socket emit error (BaristaOrderAccept):", e);
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
			return res.status(404).json({ Status: 0, status_code: 404, message: "The User Not Found" });
		}
		// Proceed with marking the order as complete
		const { order_id } = req.params;
		const { order_status } = req.body;
		const order = await db.Order.findOne({ where: { order_id, business_id } });
		if (!order) {
			return res.status(404).json({ Status: 0, status_code: 404, message: "Order Not Found" });
		}
		if (order_status !== "completed") {
			return res.status(400).json({ Status: 0, status_code: 400, message: "Invalid order status update" });
		}
		order.order_status = "completed";
		// Update all associated order items to 'served' if they are not cancelled
		await db.Order_Item.update(
			{ order_item_status: "served" },
			{ where: { order_id, order_item_status: { [Op.ne]: "cancelled" } } }
		);
		await order.save();
		// Release table if dine-in order
		if (order.order_type === "dine_in" && order.table_id) {
			try {
				await db.Tables.update(
					{ status: "available" },
					{ where: { table_id: order.table_id, business_id } }
				);
			} catch (e) {
				console.error("Error releasing table after order completion:", e);
			}
		}
		// Emit socket event for waiter order complete
		try {
			await emitToSockets(current_user_id, "waiter_order_completed", {
				order_id,
			});
		} catch (e) {
			console.error("Socket emit error (WaiterOrderComplete):", e);
		}
		return res.status(200).json({ Status: 1, status_code: 200, message: "Order Marked as Complete Successfully", data: true });
	} catch (error) {
		console.error("Error completing order:", error);
		res.status(500).json({ Status: 0, status_code: 500, message: "Internal Server Error" });
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

// Generate Bill
const GenerateBill = async (req, res) => {
	try {
		console.log("im in generate bill controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{
						[Op.or]: [
							{ role: "waiter" },
							{ role: "admin" },
							{ role: "supervisor" },
						],
					},
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		// Proceed with bill generation
		const { order_id, total_price, sub_total, discount, taxes, extra_charges } =
			req.body;
		const order = await db.Order.findOne({ where: { order_id, business_id } });
		if (!order) {
			return res.status(404).json({ Status: 0, message: "Order Not Found" });
		}

		if (order.order_status !== "complete") {
			return res
				.status(400)
				.json({ Status: 0, message: "Only completed orders can be billed" });
		}

		await db.Order.update(
			{
				bill_status: "unpaid",
				total_price,
				sub_total,
				discount,
				taxes,
				extra_charges,
			},
			{
				where: { order_id, business_id },
			}
		);

		return res
			.status(201)
			.json({ Status: 1, message: "Bill Generated Successfully" });
	} catch (error) {
		console.error("Error generating bill:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

// bill payment done by admin
const PayBill = async (req, res) => {
	try {
		console.log("im in pay bill controller");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [{ user_id: current_user_id }, { role: "admin" }],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		// Proceed with bill payment
		const { order_id, payment_method, bill_status } = req.body;
		const order = await db.Order.findOne({ where: { order_id, business_id } });
		if (!order) {
			return res.status(404).json({ Status: 0, message: "Order Not Found" });
		}
		if (order.order_status !== "complete") {
			return res
				.status(400)
				.json({ Status: 0, message: "Only completed orders can be paid" });
		}

		await db.Order.update(
			{
				bill_status,
				payment_method,
				payment_status: true,
			},
			{
				where: { order_id, business_id },
			}
		);

		await db.Tables.update(
			{ status: "available" },
			{ where: { table_id: order.table_id, business_id } }
		);

		// Emit socket event for bill payment
		try {
			await emitToSockets(current_user_id, "bill_paid", { order_id });
		} catch (e) {
			console.error("Socket emit error (PayBill):", e);
		}
		return res
			.status(200)
			.json({ Status: 1, message: "Bill Paid Successfully" });
	} catch (error) {
		console.error("Error paying bill:", error);
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
	GetOrderDetails,
	GetAllOrdersWithOrderStatus,
	MakeOrderItem,
	UpdateOrderItem,
	DeleteOrderItem,
	BaristaOrderAccept,
	GetBaristaOrderItems,
	WaiterOrderComplete,
	GenerateBill,
	PayBill,
	// GetWaiterOrders,
};

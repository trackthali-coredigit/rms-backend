require("sequelize");
require("dotenv").config();
const { Op } = require("sequelize");

//Change Admin and Supervisor to add user also

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


module.exports = {
	MakeOrder,
	UpdateOrder,
	MakeOrderItem,
	UpdateOrderItem,
};

require("sequelize");
require("dotenv").config();
const { Op, or, where } = require("sequelize");

const searchCustomers = async (req, res) => {
	try {
		const { phone_number } = req.params;
		const business_id = req.userData.business_id;
		console.log(
			req.userData.user_id,
			req.userData.business_id,
			"req.userData",
			req.userData
		);
		const pageSize = parseInt(req.query.pageSize) || 10;
		const currentPage = parseInt(req.query.page) || 1;
		const offset = (currentPage - 1) * pageSize;

		const { count, rows } = await db.User.findAndCountAll({
			where: {
				[Op.and]: [
					{ phone_no: { [Op.like]: `%${phone_number}%` } },
					{ business_id },
					{ role: "user" },
				],
			},
			limit: pageSize,
			offset,
			order: [["updatedAt", "DESC"]],
		});

		const totalPages = Math.ceil(count / pageSize);

		if (rows.length === 0) {
			return res.status(404).json({
				Status: 1,
				status_code: 404,
				message: "coustomer not fount using this phone no",
				current_page: currentPage,
				total_pages: totalPages,
				data: [],
				total: count,
			});
		}

		return res.status(200).json({
			Status: 1,
			status_code: 200,
			message: "Customer list fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			data: rows,
			total: count,
		});
	} catch (error) {
		console.error("Error searching customers:", error);
		return res.status(500).json({ Status: 0, status_code: 500, message: "Internal server error" });
	}
};

const searchCustomersById = async (req, res) => {
	try {
		const { user_id } = req.params;
		const business_id = req.userData.business_id;
		console.log(
			req.userData.user_id,
			req.userData.business_id,
			"req.userData",
			req.userData
		);
		const pageSize = parseInt(req.query.pageSize) || 10;
		const currentPage = parseInt(req.query.page) || 1;
		const offset = (currentPage - 1) * pageSize;

		const { count, rows } = await db.User.findAndCountAll({
			where: {
				[Op.and]: [
					{ user_id },
					{ business_id },
					{ role: "user" },
				],
			},
			limit: pageSize,
			offset,
			order: [["updatedAt", "DESC"]],
		});

		const totalPages = Math.ceil(count / pageSize);

		if (rows.length === 0) {
			return res.status(404).json({
				Status: 1,
				status_code: 404,
				message: "coustomer not fount using this phone no",
				current_page: currentPage,
				total_pages: totalPages,
				data: [],
				total: count,
			});
		}

		return res.status(200).json({
			Status: 1,
			status_code: 200,
			message: "Customer list fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			data: rows,
			total: count,
		});
	} catch (error) {
		console.error("Error searching customers:", error);
		return res.status(500).json({ Status: 0, status_code: 500, message: "Internal server error" });
	}
};

const addCustomer = async (req, res) => {
	try {
		const business_id = req.userData.business_id;

		const {
			first_name,
			last_name,
			// username,
			// email,
			country_code,
			iso_code,
			phone_no,
			// password,
		} = req.body;

		const same_phone = await db.User.findOne({
			where: { phone_no },
		});
		if (!!same_phone) {
			return res.status(200).json({
				Status: 1,
				status_code: 200,
				message: "This phone number already Exist",
				data: same_phone,
			});
		}
		let role = "user";

		// Create the staff member in the database
		const newStaff = await db.User.create({
			business_id: business_id,
			first_name,
			last_name,
			// username,
			// email,
			country_code,
			iso_code,
			phone_no,
			role,
			// password: hashedPassword,
		});

		res.status(200).json({
			Status: 1,
			status_code: 200,
			message: "The Customer Added Successfully",
			data: newStaff,
		});
	} catch (error) {
		console.error("Error adding customer:", error);
		res.status(500).json({
			Status: 0,
			status_code: 500,
			message: "Internal Server Error"
		});
	}
};

const deleteCustomer = async (req, res) => {
	try {
		const business_id = req.userData.business_id;
		const { user_id } = req.query;

		const user = await db.User.findOne({
			where: {
				user_id: user_id,   // ✅ FIXED
				business_id: business_id
			}
		});

		if (!user) {
			return res.status(404).json({
				Status: 0,
				status_code: 404,
				message: "User not found",
			});
		}

		await db.User.update(
			{ is_deleted: true },
			{
				where: { user_id: user_id } // ✅ FIXED
			}
		);

		return res.status(200).json({
			Status: 1,
			status_code: 200,
			message: "Customer deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting customer:", error);
		return res.status(500).json({
			Status: 0,
			status_code: 500,
			message: "Internal Server Error"
		});
	}
};

module.exports = {
	searchCustomers,
	searchCustomersById,
	addCustomer,
	deleteCustomer,
};

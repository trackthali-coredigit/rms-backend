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
			attributes: [
				"first_name",
				"last_name",
				"user_id",
				"phone_no",
				"email",
				"country_code",
			],
			limit: pageSize,
			offset,
			order: [["updatedAt", "DESC"]],
		});

		const totalPages = Math.ceil(count / pageSize);

		return res.status(200).json({
			Status: 1,
			message: "Customer list fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			customers: rows,
			total: count,
		});
	} catch (error) {
		console.error("Error searching customers:", error);
		return res.status(500).json({ error: "Internal server error" });
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
			return res
				.status(201)
				.json({ Status: 0, message: "This phone number already Exist" });
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

		res.status(201).json({
			Status: 1,
			message: "The Customer Added Successfully",
			customer: newStaff,
		});
	} catch (error) {
		console.error("Error adding customer:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
module.exports = {
	searchCustomers,
	addCustomer,
};

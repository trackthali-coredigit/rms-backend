const { Op } = require("sequelize");

const AddContactInfo = async (req, res) => {
	try {
		console.log("Creating contact info");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;

		const { subject, message } = req.body;

		const newContactInfo = await db.Contact_Info.create({
			user_id: current_user_id,
			business_id,
			subject,
			message,
		});

		return res.status(201).json({
			Status: 1,
			message: "Contact info submitted successfully",
			data: newContactInfo,
		});
	} catch (error) {
		console.error("Error creating contact info:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const GetAllContactInfo = async (req, res) => {
	try {
		console.log("Getting all contact info");
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;

		const user = await db.User.findOne({
			where: {
				[Op.and]: [{ user_id: current_user_id }, { role: "admin" }],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "User not authorized" });
		}

		const { page = 1, sort_by = "createdAt", sort_order = "DESC" } = req.query;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;

		const offset = (currentPage - 1) * pageSize;

		// Sorting
		let order = [["createdAt", "DESC"]];
		if (sort_by) {
			const validSortOrder =
				sort_order && ["ASC", "DESC"].includes(sort_order.toUpperCase())
					? sort_order.toUpperCase()
					: "DESC";
			order = [[sort_by, validSortOrder]];
		}

		const { count, rows } = await db.Contact_Info.findAndCountAll({
			where: { business_id },
			include: [
				{
					model: db.User,
					attributes: ["user_id", "first_name", "last_name", "email"],
					required: false,
				},
				{
					model: db.Business,
					attributes: ["business_id", "business_name"],
					required: false,
				},
			],
			limit: pageSize,
			offset,
			order,
			distinct: true,
		});

		const totalPages = Math.ceil(count / pageSize);

		return res.status(200).json({
			Status: 1,
			message: "Contact info fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			contact_info: rows,
			total: count,
		});
	} catch (error) {
		console.error("Error getting contact info:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

module.exports = {
	AddContactInfo,
	GetAllContactInfo,
};

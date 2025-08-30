require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const common_fun = require("../common/common_fun");
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const fs = require("fs");
const { Op } = require("sequelize");

const SuperAdminSignIn = async (req, res) => {
	try {
		const { email, password, device_id, device_type, device_token } = req.body;
		console.log("Request Body:", req.body);
		const user = await db.User.findOne({
			where: { email, role: "super_admin" },
		});
		const getallUser = await db.User.findAll();
		console.log("user is here----------?", user);
		console.log("All users are here----------?", getallUser);
		if (!user)
			return res
				.status(404)
				.json({ Status: 0, message: "Super admin not found" });

		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch)
			return res
				.status(401)
				.json({ Status: 0, message: "Invalid sign-in credentials" });

		const deviceDetail = {
			device_id,
			device_type,
			device_token,
			user_id: user.user_id,
		};
		let deviceDetails = await db.Token.findOne({
			where: { device_id, user_id: user.user_id },
		});

		if (!deviceDetails) {
			deviceDetails = await db.Token.create(deviceDetail);
		} else {
			deviceDetails.device_type = device_type;
			deviceDetails.device_token = device_token;
			const randomNumber = Math.floor(1 + Math.random() * 9);
			deviceDetails.tokenVersion += randomNumber;
			await deviceDetails.save();
		}

		// Generate JWT token
		const token = jwt.sign(
			{
				userId: user.user_id,
				tokenVersion: deviceDetails.tokenVersion,
				tokenId: deviceDetails.token_id,
			},
			process.env.JWT_SECRET_KEY
		);

		return res
			.status(200)
			.json({
				Status: 1,
				message: "Sign-in successful",
				token,
				user_id: user.user_id,
			});
	} catch (error) {
		console.error("Error during super admin sign-in:", error);
		return res
			.status(500)
			.json({ Status: 0, message: "Internal server error" });
	}
};
const createAdmin = async (req, res) => {
	try {
		if (req.userData.role !== "super_admin")
			return res.status(401).json({ Status: 0, message: "Unauthorize" });

		const {
			first_name,
			last_name,
			username,
			country_code,
			iso_code,
			phone_no,
			email,
			password,
			business_name,
			business_email,
			business_phone_no,
			business_country_code,
			business_iso_code,
		} = req.body;

		const existingAdminWithEmail = await db.User.findOne({
			where: { email: email, role: "admin", is_deleted: false },
		});
		const existingAdminWithUsername = await db.User.findOne({
			where: { username, is_deleted: false },
		});

		if (!!existingAdminWithEmail) {
			return res
				.status(409)
				.json({ Status: 0, message: "Email already exists" });
		}

		if (!!existingAdminWithUsername) {
			return res
				.status(409)
				.json({ Status: 0, message: "Username already exists" });
		}
		const hashedPassword = await bcrypt.hash(password, 10);

		let { business_image } = req.files;
		const ext = business_image[0].originalname.split(".").pop();
		const imageUrlMedia = business_image[0].filename;
		const imageUrlWithExt = `${business_image[0].filename}.${ext}`;
		fs.renameSync(
			`uploads/business_image/${imageUrlMedia}`,
			`uploads/business_image/${imageUrlWithExt}`
		);
		business_image = `uploads/business_image/${imageUrlWithExt}`;

		const existBusiness = await db.Business.create({
			business_name,
			business_email,
			business_phone_no,
			country_code: business_country_code,
			iso_code: business_iso_code,
			business_image,
		});
		await db.User.create({
			business_id: existBusiness.business_id,
			role: "admin",
			email,
			password: hashedPassword,
			first_name,
			last_name,
			username,
			country_code,
			iso_code,
			phone_no,
		});
		// Send OTP in the response
		res.status(201).json({ Status: 1, message: "Admin  created succesfully" });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ Status: 0, message: "Internal server error" });
	}
};
const editAdmin = async (req, res) => {
	try {
		if (req.userData.role !== "super_admin")
			return res.status(401).json({ Status: 0, message: "Unauthorized" });

		const {
			admin_id,
			business_name,
			business_email,
			business_phone_no,
			business_country_code,
			business_iso_code,
			first_name,
			last_name,
			username,
			country_code,
			iso_code,
			phone_no,
			email,
			password,
		} = req.body;

		const existingAdmin = await db.User.findOne({
			where: { user_id: admin_id, role: "admin", is_deleted: false },
		});
		if (!existingAdmin)
			return res.status(404).json({ Status: 0, message: "Admin not found" });

		const existingBussiness = await db.Business.findByPk(
			existingAdmin.business_id
		);

		if (email) {
			const existingAdminWithEmail = await db.User.findOne({
				where: { email, user_id: { [Op.ne]: admin_id }, is_deleted: false },
			});
			if (existingAdminWithEmail)
				return res
					.status(409)
					.json({ Status: 0, message: "Email already exists" });
		}

		if (username) {
			const existingAdminWithUsername = await db.User.findOne({
				where: { username, user_id: { [Op.ne]: admin_id }, is_deleted: false },
			});
			if (existingAdminWithUsername)
				return res
					.status(409)
					.json({ Status: 0, message: "Username already exists" });
		}

		await db.User.update(
			{
				first_name,
				last_name,
				username,
				country_code,
				iso_code,
				phone_no,
				email,
				...(password && { password: await bcrypt.hash(password, 10) }), // Update password only if provided
			},
			{
				where: { user_id: admin_id },
			}
		);

		// Update business details
		const businessUpdateData = {
			business_name,
			business_email,
			business_phone_no,
			country_code: business_country_code,
			iso_code: business_iso_code,
		};

		if (req.files && req.files.business_image) {
			let { business_image } = req.files;
			if (existingBussiness.business_image != null) {
				fs.unlinkSync(existingBussiness.business_image);
			}
			const ext = business_image[0].originalname.split(".").pop();
			const imageUrlMedia = business_image[0].filename;
			const imageUrlWithExt = `${business_image[0].filename}.${ext}`;
			fs.renameSync(
				`uploads/business_image/${imageUrlMedia}`,
				`uploads/business_image/${imageUrlWithExt}`
			);
			businessUpdateData.business_image = `uploads/business_image/${imageUrlWithExt}`;
		}

		await existingBussiness.update(businessUpdateData);

		res.status(200).json({ Status: 1, message: "Admin updated successfully" });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ Status: 0, message: "Internal server error" });
	}
};

const getBusinessAdminList = async (req, res) => {
	try {
		if (req.userData.role !== "super_admin")
			return res
				.status(401)
				.json({
					status: 0,
					message: "User is not authorized to access admin list",
				});

		const page = parseInt(req.query.page);
		const limit = 10;
		const offset = (page - 1) * limit;

		const { count, rows: adminList } = await db.User.findAndCountAll({
			attributes: {
				exclude: [
					"password",
					"updatedAt",
					"otp",
					"otp_created_at",
					"is_verify",
					"is_account_setup",
					"is_deleted",
				],
			},
			where: { role: "admin" },

			include: [
				{
					model: db.Business,
					attributes: { exclude: ["createdAt", "updatedAt", "is_deleted"] },

					include: [
						{
							model: db.BusinessHours,
							attributes: { exclude: ["createdAt", "updatedAt"] },
						},
					],
				},
			],

			order: [["createdAt", "DESC"]], // Correctly specify the order by createdAt
			limit: limit,
			offset: offset,
		});

		if (count === 0)
			return res.status(404).json({ status: 0, message: "No admin found" });

		const totalPages = Math.ceil(count / limit);
		res
			.status(200)
			.json({
				status: 1,
				message: "Admins fetched successfully",
				totalPages,
				adminList,
			});
		// res.status(200).json({ status: 1, message: "Admins fetched successfully", adminList });
	} catch (error) {
		console.error("Error fetching admin list:", error);
		res.status(500).json({ status: 0, message: "Internal Server Error" });
	}
};
const getStaffList = async (req, res) => {
	try {
		if (req.userData.role !== "super_admin")
			return res.status(401).json({ Status: 0, message: "Unauthorized" });

		const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
		const limit = 10;
		const offset = (page - 1) * limit;

		let staffList = [];
		let totalPages = 0;
		let count = 0;

		const whereCondition = {
			business_id: req.query.business_id,
			role: req.query.role,
		};

		if (req.query.role === "waiter") {
			const result = await db.User.findAndCountAll({
				attributes: {
					exclude: [
						"password",
						"updatedAt",
						"otp",
						"otp_created_at",
						"is_verify",
						"is_account_setup",
						"is_deleted",
					],
				},
				where: whereCondition,
				include: [
					{
						model: db.Waiter,
						attributes: { exclude: ["createdAt", "updatedAt", "is_deleted"] },
						include: [
							{
								attributes: {
									exclude: ["createdAt", "updatedAt", "is_deleted"],
								},
								model: db.Tables,
							},
						],
					},
				],
				distinct: true,
				order: [["createdAt", "DESC"]],
				limit: limit,
				offset: offset,
			});
			count = result.count;
			staffList = result.rows;
		}

		if (req.query.role === "barista" || req.query.role === "supervisor") {
			// Fetch data for baristas or supervisors without extra includes
			const result = await db.User.findAndCountAll({
				attributes: {
					exclude: [
						"password",
						"createdAt",
						"updatedAt",
						"otp",
						"otp_created_at",
						"is_verify",
						"is_account_setup",
						"is_deleted",
					],
				},
				where: whereCondition,
				distinct: true,
				order: [["createdAt", "DESC"]],
				limit: limit,
				offset: offset,
			});
			count = result.count;
			staffList = result.rows;
		}

		totalPages = Math.ceil(count / limit);

		res.status(200).json({
			Status: 1,
			message: "Get Staff List successfully",
			current_page: page,
			total_pages: totalPages,
			staffList: staffList,
		});
	} catch (error) {
		console.error("Error fetching staff list:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const getBusinessList = async (req, res) => {
	try {
		if (req.userData.role !== "super_admin")
			return res
				.status(401)
				.json({
					status: 0,
					message: "User is not authorized to access admin list",
				});

		// const page = parseInt(req.query.page);
		// const limit = 10;
		// const offset = (page - 1) * limit;

		const { count, rows: bussinessList } = await db.Business.findAndCountAll({
			attributes: { exclude: ["createdAt", "updatedAt", "is_deleted"] },
			order: [["createdAt", "DESC"]],
			// limit: limit,
			// offset: offset,
		});

		if (count === 0)
			return res.status(404).json({ status: 0, message: "No admin found" });

		// const totalPages = Math.ceil(count / limit);
		// res.status(200).json({ status: 1, message: "bussiness fetched successfully", totalPages, bussinessList });
		res
			.status(200)
			.json({
				status: 1,
				message: "bussiness fetched successfully",
				bussinessList,
			});
	} catch (error) {
		console.error("Error fetching admin list:", error);
		res.status(500).json({ status: 0, message: "Internal Server Error" });
	}
};
const getBusinessTableList = async (req, res) => {
	try {
		if (req.userData.role !== "super_admin")
			return res
				.status(401)
				.json({ status: 0, message: "User is not authorized to access " });

		const isBussiness = await db.Business.findByPk(req.query.business_id);
		if (!isBussiness)
			return res.status(404).json({ Status: 0, message: "bussines not found" });

		const page = parseInt(req.query.page);
		const limit = 10;
		const offset = (page - 1) * limit;

		let { count, rows: tables } = await db.Tables.findAndCountAll({
			attributes: { exclude: ["createdAt", "updatedAt", "is_deleted"] },
			where: { business_id: req.query.business_id },
			distinct: true,
			order: [["createdAt", "DESC"]],
			limit: limit,
			offset: offset,
		});

		if (count === 0)
			return res
				.status(200)
				.json({
					Status: 0,
					message: "No table found",
					tables,
					bussiness_data: isBussiness,
				});
		const totalPages = Math.ceil(count / limit);
		res
			.status(200)
			.json({
				Status: 1,
				message: "Get Table List Succesfully",
				totalPages,
				tables,
				bussiness_data: isBussiness,
			});
	} catch (error) {
		console.error("Error fetching table list:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const getBusinessCategoryList = async (req, res) => {
	try {
		if (req.userData.role !== "super_admin")
			return res
				.status(401)
				.json({ status: 0, message: "User is not authorized to access " });

		const isBussiness = await db.Business.findByPk(req.query.business_id);
		if (!isBussiness)
			return res.status(404).json({ status: 0, message: "bussines not found" });

		const page = parseInt(req.query.page);
		const limit = 10;
		const offset = (page - 1) * limit;

		let { count, rows: categories } = await db.Category.findAndCountAll({
			where: { business_id: req.query.business_id },
			attributes: ["category_id", "category_name"], // Select only the necessary attributes
			distinct: true,
			limit: limit,
			offset: offset,
		});
		const totalPages = Math.ceil(count / limit);
		res
			.status(200)
			.json({
				Status: 1,
				message: "The Category get Succesfully",
				totalPages,
				categories,
			});
	} catch (error) {
		console.error("Error fetching category list:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const getBusinessItemList = async (req, res) => {
	try {
		if (req.userData.role !== "super_admin")
			return res
				.status(401)
				.json({ status: 0, message: "User is not authorized to access " });

		const isCategory = await db.Category.findByPk(req.query.category_id);
		if (!isCategory)
			return res.status(404).json({ status: 0, message: "category not found" });

		const page = parseInt(req.query.page);
		const limit = 10;
		const offset = (page - 1) * limit;

		let { count, rows } = await db.Items.findAndCountAll({
			// where: whereClause,
			include: [
				{
					model: db.Business,
					required: true,
				},
				{
					model: db.Item_Img,
					required: true,
				},
				{
					model: db.Ingrediant,
					required: true,
				},
				{
					model: db.Category,
					where: { category_id: req.query.category_id },
					required: true,
				},
			],
			distinct: true,
			limit: limit,
			offset: offset,
		});

		if (count === 0)
			return res
				.status(200)
				.json({ Status: 0, message: "No ItemList found", data: rows });

		const totalPages = Math.ceil(count / limit);
		res
			.status(200)
			.json({
				Status: 1,
				message: "The ItemList get succesfully",
				totalPages,
				data: rows,
			});
	} catch (error) {
		console.error("Error fetching item list:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
module.exports = {
	SuperAdminSignIn,

	createAdmin,
	editAdmin,
	getBusinessAdminList,
	getStaffList,

	getBusinessList,

	getBusinessTableList,

	getBusinessCategoryList,
	getBusinessItemList,
};

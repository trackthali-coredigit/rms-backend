require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const common_fun = require("../common/common_fun");
const fs = require("fs");
const { Op } = require("sequelize");
const { sendNotification } = require("../common/notification");
const {
	uploadToCloudinary,
	deleteFromCloudinary,
	uploadMultipleToCloudinary,
	extractPublicIdFromUrl,
	validateMultipleImageFiles,
} = require("../common/cloudinaryUtils");
const signin = async (req, res) => {
	try {
		console.log("1");
		const {
			emailOrUsername,
			password,
			device_id,
			device_type,
			device_token,
			role,
		} = req.body;
		let user = await db.User.findOne({
			where: {
				[Op.or]: [{ email: emailOrUsername }, { username: emailOrUsername }],
				role: role,
				is_deleted: false,
			},
		});
		if (!user)
			return res
				.status(200)
				.json({ Status: 0, message: "The User Not Found or not verified" });

		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch)
			return res
				.status(200)
				.json({ Status: 0, message: "Invalid Sign-In Credentials!" });

		let deviceDetail = {
			device_id,
			device_type,
			device_token,
			user_id: user.user_id,
		};
		let deviceDetails = await db.Token.findOne({ where: deviceDetail });
		if (!deviceDetails) deviceDetails = await db.Token.create(deviceDetail);

		if (role === "admin") {
			// const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
			const otp = `1234`;
			await user.update({ otp: otp, otp_created_at: new Date() });

			const emailf = user.email;
			const fullName = `${user.first_name} ${user.last_name}`;
			await common_fun.sendOTPByEmail(emailf, otp, fullName);

			return res.status(200).json({
				Status: 1,
				message: "OTP sent to your registered email successfully",
				otp: otp,
				user_id: user.user_id,
			});
		}
		deviceDetails.tokenVersion += 1;
		await deviceDetails.save();
		var token = jwt.sign(
			{
				userId: user.user_id,
				tokenVersion: deviceDetails.tokenVersion,
				tokenId: deviceDetails.token_id,
			},
			process.env.JWT_SECRET_KEY
		);

		if (role === "user" && !user.is_verify) {
			const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
			await user.update({ otp: otp, otp_created_at: new Date() });

			const emailf = await db.User.findOne({
				where: { user_id: user.user_id },
				attributes: ["email"],
			});

			const fullName = `${user.first_name} ${user.last_name}`;
			await common_fun.sendOTPByEmail(emailf.dataValues.email, otp, fullName);

			return res.status(200).json({
				Status: 2,
				message: "Please verify your Account First",
				token,
				otp,
				user_id: user.user_id,
			});
		}

		if (role === "user" && !user.is_account_setup)
			return res.status(200).json({
				Status: 3,
				message: "Please setup your Account First",
				token,
				user_id: user.user_id,
			});
		res.status(200).json({
			Status: 1,
			message: "Sign-in successfully",
			token,
			user_id: user.user_id,
		});
	} catch (error) {
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const otp_verify = async (req, res) => {
	try {
		const { emailOrUsername, otp, role } = req.body;
		let user;
		if (!!emailOrUsername) {
			user = await db.User.findOne({
				where: {
					[Op.or]: [
						{
							email: emailOrUsername,
						},
						{
							username: emailOrUsername,
						},
					],
					role: role,
					is_deleted: false,
				},
			});
		}
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		if (user.otp != otp) {
			return res.status(200).json({ Status: 0, message: "Invalid OTP" });
		}

		// Check if OTP has expired
		const currentTime = new Date();
		const otpCreationTime = new Date(user.otp_created_at);
		const otpExpirationTime = new Date(
			otpCreationTime.getTime() + 1 * 60 * 1000
		); // Assuming OTP expires in 5 minutes
		if (currentTime > otpExpirationTime) {
			return res.status(200).json({ Status: 0, message: "OTP has expired" });
		}

		await db.User.update(
			{ is_verify: true },
			{ where: { user_id: user.user_id } }
		);

		if (user.role === "admin") {
			const { device_id, device_type, device_token } = req.body;
			let deviceDetails;
			deviceDetails = await db.Token.findOne({
				where: {
					device_id,
					device_type,
					device_token,
				},
			});
			if (!deviceDetails) {
				deviceDetails = await db.Token.create({
					device_id,
					device_type,
					device_token,
					user_id: user.user_id,
				});
				// return res.status(200).json({ Status: 0, message: "device not found" });
			}

			deviceDetails.tokenVersion += 1;
			await deviceDetails.save();
			const token = jwt.sign(
				{
					userId: user.user_id,
					tokenVersion: deviceDetails.tokenVersion,
					tokenId: deviceDetails.token_id,
				},
				process.env.JWT_SECRET_KEY
			);

			return res.status(200).json({
				Status: 1,
				message: "Admin sign-In successfully",
				token: token,
				user_id: user.user_id,
			});
		}
		if (user.role === "user") {
			const { device_id, device_type, device_token } = req.body;
			let deviceDetails;
			deviceDetails = await db.Token.findOne({
				where: {
					device_id,
					device_type,
					device_token,
				},
			});
			if (!deviceDetails) {
				deviceDetails = await db.Token.create({
					device_id,
					device_type,
					device_token,
					user_id: user.user_id,
				});
				// return res.status(200).json({ Status: 0, message: "device not found" });
			}

			deviceDetails.tokenVersion += 1;
			await deviceDetails.save();
			const token = jwt.sign(
				{
					userId: user.user_id,
					tokenVersion: deviceDetails.tokenVersion,
					tokenId: deviceDetails.token_id,
				},
				process.env.JWT_SECRET_KEY
			);

			return res.status(200).json({
				Status: 1,
				message: "OTP verified successfully",
				token: token,
				user_id: user.user_id,
			});
		}
		res.status(200).json({
			Status: 1,
			message: "User verified successfully",
			user_id: user.user_id,
		});
	} catch (error) {
		console.error("Error verifying OTP:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const forgetPassword = async (req, res) => {
	try {
		const { emailOrUsername } = req.body;

		let user;
		if (!!emailOrUsername) {
			user = await db.User.findOne({
				where: {
					[Op.or]: [
						{
							email: emailOrUsername,
						},
						{
							username: emailOrUsername,
						},
					],
					is_deleted: false,
				},
			});
		}
		if (!user) {
			return res.status(200).json({ Status: 0, message: "The User Not Found" });
		}

		const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
		await db.User.update(
			{ otp: otp, otp_created_at: new Date() },
			{ where: { user_id: user.user_id } }
		);
		const emailf = await db.User.findOne({
			where: { user_id: user.user_id },
			attributes: ["email"],
		});
		const fullName = `${user.first_name} ${user.last_name}`;
		await common_fun.sendOTPByEmail(emailf.dataValues.email, otp, fullName);
		res.status(200).json({
			Status: 1,
			message: "OTP sent to your email",
			otp: otp,
		});
	} catch (error) {
		console.error("Error sending temporary password:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const StaffForgetPassword = async (req, res) => {
	try {
		const { user_id, password } = req.body;
		const user = await db.User.findByPk(user_id);
		switch (req.userData.role) {
			case "admin":
				if (
					user.role == "admin" ||
					user.role == "super_admin" ||
					user.business_id != req.userData.business_id
				) {
					return res.status(404).json({
						Status: 0,
						message: "The User Not uthorize for this action",
					});
				}

				break;
			case "supervisor":
				if (
					user.role == "admin" ||
					user.role == "super_admin" ||
					user.role == "supervisor" ||
					user.business_id != req.userData.business_id
				) {
					return res.status(404).json({
						Status: 0,
						message: "The User Not uthorize for this action",
					});
				}
				break;
			default:
				return res.status(404).json({
					Status: 0,
					message: "The User Not uthorize for this action",
				});
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		user.password = hashedPassword;
		await user.save();
		res.status(200).json({
			Status: 1,
			message: "Password Change Succesfully",
		});
	} catch (error) {
		console.error("Error sending temporary password:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const resetPassword = async (req, res) => {
	try {
		const { emailOrUsername, newPassword } = req.body;

		let user;
		if (!!emailOrUsername) {
			user = await db.User.findOne({
				where: {
					[Op.or]: [
						{
							email: emailOrUsername,
						},
						{
							username: emailOrUsername,
						},
					],
					is_deleted: false,
				},
			});
		}
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		// Update user's password
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await db.User.update(
			{ password: hashedPassword },
			{ where: { user_id: user.user_id } }
		);

		res.status(200).json({
			Status: 1,
			message: "Password reset Successfully",
		});
	} catch (error) {
		console.error("Error resetting password:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const changePassword = async (req, res) => {
	try {
		const { oldPassword, newPassword } = req.body;
		if (oldPassword === newPassword)
			return res.status(400).json({
				Status: 0,
				message: "New password must be different from the old password",
			});

		const user = req.userData;

		const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
		if (!isPasswordValid)
			return res
				.status(200)
				.json({ Status: 0, message: "Invalid Current password" });

		if (oldPassword === newPassword)
			return res.status(200).json({
				Status: 0,
				message: "New password must be different from the old password",
			});

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		user.password = hashedPassword;
		await user.save();

		res
			.status(200)
			.json({ Status: 1, message: "Password changed successfully" });
	} catch (error) {
		console.error("Error changing password:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const signOut = async (req, res) => {
	try {
		// const user_id = req.userData.user_id; // Assuming the user ID is stored in req.userData
		// const user = await db.User.findByPk(user_id);

		// if (!user) {
		//   return res.status(404).json({ Status: 0, message: "The User Not Found" });
		// }
		// const { device_id, device_type, device_token } = req.body;
		// const deviceDetails = await db.Token.findOne({
		//   where: {
		//     device_id,
		//     device_type,
		//     device_token,
		//   },
		// });
		// if (!deviceDetails) {
		//   return res.status(200).json({ Status: 0, message: "device not found" });
		// }

		await db.Token.destroy({ where: { token_id: req.tokenData.token_id } });
		res.status(200).json({ Status: 1, message: "Logout successfully" });
	} catch (error) {
		console.error("Error during logout:", error);
		res.status(500).json({ Status: 0, message: "Internal server error" });
	}
};

const businessHours = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const { day, opening_hours, closing_hours, day_status, value } = req.body;
		const user = await db.User.findOne({
			where: { user_id, role: "admin" },
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "Admin not Found" });
		}

		switch (value) {
			case "is_all":
				const days = [
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
					"Sunday",
				];
				const promises = days.map(async (d) => {
					const existingEntry = await db.BusinessHours.findOne({
						where: { business_id: user.business_id, day: d },
					});
					if (existingEntry) {
						// Update existing entry
						return existingEntry.update({
							opening_hours,
							closing_hours,
							day_status,
						});
					} else {
						// Create new entry
						return db.BusinessHours.create({
							day: d,
							opening_hours,
							closing_hours,
							day_status,
							business_id: user.business_id,
						});
					}
				});
				const createdOrUpdatedBusinessHours = await Promise.all(promises);
				return res.status(201).json({
					Status: 1,
					message: "Business hours added/updated successfully for all days",
					createdOrUpdatedBusinessHours,
				});
			case "is_create":
				const BusinessHoursdata = await db.BusinessHours.create({
					day,
					opening_hours,
					closing_hours,
					day_status,
					business_id: user.business_id,
				});
				return res.status(201).json({
					Status: 1,
					message: "Business hours added successfully",
					BusinessHoursdata,
				});
			case "is_edit":
				const editedData = await db.BusinessHours.update(
					{ opening_hours, closing_hours, day_status },
					{ where: { day, business_id: user.business_id } }
				);
				if (editedData[0] > 0) {
					return res.status(200).json({
						Status: 1,
						message: "Business hours updated successfully",
					});
				} else {
					return res.status(200).json({
						Status: 0,
						message: "Business hours not found or not updated",
						editedData,
					});
				}
			case "is_get":
				const businesshoursList = await db.BusinessHours.findAll({
					where: { business_id: user.business_id },
				});
				return res.status(200).json({
					Status: 1,
					message: "Business hours list get successfully",
					businesshoursList,
				});
			default:
				return res
					.status(400)
					.json({ Status: 0, message: "Invalid operation value" });
		}
	} catch (error) {
		console.error("Error business hours:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const addCategory = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const businessId = user.business_id;

		// Extract category name from the request body
		const { category_name } = req.body;
		const categoryExist = await db.Category.findOne({
			where: { category_name, business_id: user.business_id },
		});
		if (!!categoryExist) {
			return res
				.status(201)
				.json({ Status: 0, message: "The category already exist" });
		}
		// Create the category
		const category = await db.Category.create({
			category_name,
			business_id: businessId,
		});

		res.status(201).json({
			Status: 1,
			message: "The Category added successfully",
			category,
		});
	} catch (error) {
		console.error("Error adding category:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const editCategory = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const { category_id, category_name } = req.body;
		const category = await db.Category.findOne({
			where: { category_id, business_id: user.business_id },
		});
		if (!category) {
			return res
				.status(404)
				.json({ Status: 0, message: "The Category Not Found" });
		}
		category.category_name = category_name;
		await category.save();
		return res.status(200).json({
			Status: 1,
			message: "The Category updated successfully",
			category,
		});
	} catch (error) {
		console.error("Error editing category:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const deleteCategory = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const category_id = req.body.category_id;
		const category = await db.Category.findByPk(category_id);
		if (!category) {
			return res
				.status(404)
				.json({ Status: 0, message: "The Category not found" });
		}
		// Find items associated with the category
		const items = await db.Items.findAll({ where: { category_id } });

		// Delete item images and ingredients associated with each item
		for (const item of items) {
			await db.Item_Img.destroy({ where: { item_id: item.item_id } });
			await db.Ingrediant.destroy({ where: { item_id: item.item_id } });
		}

		// Delete items associated with the category
		await db.Items.destroy({ where: { category_id } });

		// Finally, delete the category itself
		await category.destroy();

		res
			.status(200)
			.json({ Status: 1, message: "The Category deleted successfully" });
	} catch (error) {
		console.error("Error deleting category:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const addItem = async (req, res) => {
	try {
		const user_id = req.userData.user_id;

		const user = await db.User.findOne({
			where: {
				user_id,
				role: { [Op.in]: ["admin", "supervisor"] },
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		let { item_name, price, stock, ingredients, category_id } = req.body;
		const images = req.files.item_image;
		// Parse ingredients if it is a string (e.g., from form-data)
		if (ingredients && typeof ingredients === "string") {
			try {
				// Replace HTML entities for quotes if present
				const normalized = ingredients
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/'/g, '"');
				const parsed = JSON.parse(normalized);
				ingredients = Array.isArray(parsed) ? parsed : [parsed];
				console.log("Parsed ingredients:", ingredients);
			} catch (e) {
				console.error("Error parsing ingredients:", e);
				return res
					.status(400)
					.json({ Status: 0, message: "Invalid ingredients format" });
			}
		}

		// Create the item
		const item = await db.Items.create({
			business_id: user.business_id,
			category_id,
			item_name,
			price,
			stock,
		});

		// Image Validation using Cloudinary utils
		const imageValidation = validateMultipleImageFiles(
			images,
			["jpg", "jpeg", "png"],
			4 * 1024 * 1024, // 4MB
			10 // max 10 images
		);

		if (!imageValidation.isValid) {
			// Note: With memory storage, no files to clean up on disk
			return res.status(400).json({
				Status: 0,
				message: imageValidation.error,
			});
		}

		// Upload images to Cloudinary
		try {
			const cloudinaryResults = await uploadMultipleToCloudinary(
				images,
				"rms/item_images"
			);

			// Save image URLs to database
			const imageProcessingPromises = cloudinaryResults.map((result) => {
				return db.Item_Img.create({
					item_id: item.item_id,
					image: result.url,
					public_id: result.public_id, // Store public_id for deletion
				});
			});

			// Wait for all images to be processed
			await Promise.all(imageProcessingPromises);
		} catch (uploadError) {
			console.error("Error uploading images to Cloudinary:", uploadError);
			return res.status(500).json({
				Status: 0,
				message: "Failed to upload images. Please try again.",
			});
		}

		if (Array.isArray(ingredients) && ingredients.length > 0) {
			await db.Ingrediant.bulkCreate(
				ingredients.map((ingredient) => ({
					item_id: item.item_id,
					name: ingredient.name,
					price: ingredient.price,
					quantity: ingredient.quantity,
				}))
			);
		}

		const users = await db.User.findAll({
			attributes: ["user_id"],
			where: {
				business_id: req.userData.business_id,
				user_id: {
					[Op.ne]: req.userData.user_id,
				},
			},
		});
		console.log(">>>>>>>>>>>", users);
		// const usersArray = [];
		// const message = `A new item has been added`;
		// const data = {
		// 	item_id: item.item_id,
		// 	notification_type: "New Item",
		// };

		// const notifications = users.map((user) => {
		// 	usersArray.push(user.dataValues.user_id);
		// 	return {
		// 		notification_from: req.userData.user_id,
		// 		notification_to: user.user_id,
		// 		title: "New Item",
		// 		notification_message: "A new item has been added",
		// 		notification_type: "New Item",
		// 	};
		// });
		// console.log(">>>>>>>>>>>>usersArray", usersArray);
		// const created = await db.Notification.bulkCreate(notifications);
		// await sendNotification(usersArray, message, data);
		res.status(201).json({ Status: 1, message: "The Item added successfully" });
	} catch (error) {
		console.error("Error adding item:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const editItem = async (req, res) => {
	try {
		const user_id = req.userData.user_id;

		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		let { item_id, item_name, price, stock, ingredients } = req.body;
		if (ingredients && typeof ingredients === "string") {
			try {
				// Replace HTML entities for quotes if present
				const normalized = ingredients
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/'/g, '"');
				const parsed = JSON.parse(normalized);
				ingredients = Array.isArray(parsed) ? parsed : [parsed];
			} catch (e) {
				console.error("Error parsing ingredients:", e);
				return res
					.status(400)
					.json({ Status: 0, message: "Invalid ingredients format" });
			}
		}

		const item = await db.Items.findByPk(item_id);
		if (!item) {
			return res.status(404).json({ Status: 0, message: "The Item not found" });
		}
		if (item_name) item.item_name = req.body.item_name;
		if (price) item.price = req.body.price;
		if (stock) item.stock = req.body.stock;
		await item.update({
			item_name,
			price,
			stock,
		});
		if (req.files != undefined && req.files.item_image) {
			// Find previous images for this item
			const previousImages = await db.Item_Img.findAll({
				where: { item_id: item.item_id },
			});

			// Delete previous images from Cloudinary
			for (const img of previousImages) {
				let publicId = img.public_id;
				if (!publicId && img.image) {
					publicId = extractPublicIdFromUrl(img.image);
				}
				if (publicId) {
					try {
						await deleteFromCloudinary(publicId);
					} catch (cloudinaryError) {
						console.warn(
							`Failed to delete from Cloudinary: ${cloudinaryError.message}`
						);
					}
				}
			}

			// Delete previous images from Item_Img table for this item
			await db.Item_Img.destroy({ where: { item_id: item.item_id } });

			// Image Validation using Cloudinary utils
			const images = req.files.item_image;
			const imageValidation = validateMultipleImageFiles(
				images,
				["jpg", "jpeg", "png"],
				4 * 1024 * 1024, // 4MB
				10 // max 10 images
			);

			if (!imageValidation.isValid) {
				return res.status(400).json({
					Status: 0,
					message: imageValidation.error,
				});
			}

			// Upload images to Cloudinary
			try {
				const cloudinaryResults = await uploadMultipleToCloudinary(
					images,
					"rms/item_images"
				);

				// Save new image URLs to database
				const imageProcessingPromises = cloudinaryResults.map((result) => {
					return db.Item_Img.create({
						item_id: item.item_id,
						image: result.url,
						public_id: result.public_id,
					});
				});

				await Promise.all(imageProcessingPromises);
			} catch (uploadError) {
				console.error("Error uploading images to Cloudinary:", uploadError);
				return res.status(500).json({
					Status: 0,
					message: "Failed to upload images. Please try again.",
				});
			}
		}
		if (Array.isArray(ingredients) && ingredients.length > 0) {
			// Remove existing ingredients for the item
			await db.Ingrediant.destroy({ where: { item_id: item.item_id } });

			// Add new ingredients
			await db.Ingrediant.bulkCreate(
				ingredients.map((ingredient) => ({
					item_id: item.item_id,
					name: ingredient.name,
					price: ingredient.price,
					quantity: ingredient.quantity,
				}))
			);
		}
		res.status(200).json({
			Status: 1,
			message: "The Item updated successfully",
			Item_Data: item,
		});
	} catch (error) {
		console.error("Error editing item:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const deleteItemImage = async (req, res) => {
	try {
		const { imageId } = req.body;

		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		// Find the image by ID
		const image = await db.Item_Img.findByPk(imageId);
		if (!image) {
			return res.status(404).json({ Status: 0, message: "Image not found" });
		}

		// Delete the image from Cloudinary if it has a public_id or extract from URL
		try {
			let publicId = image.public_id;

			// If no public_id stored, try to extract from URL (for backward compatibility)
			if (!publicId && image.image) {
				publicId = extractPublicIdFromUrl(image.image);
			}

			// Delete from Cloudinary if we have a public_id
			if (publicId) {
				try {
					await deleteFromCloudinary(publicId);
					console.log(
						`Successfully deleted image from Cloudinary: ${publicId}`
					);
				} catch (cloudinaryError) {
					console.warn(
						`Failed to delete from Cloudinary: ${cloudinaryError.message}`
					);
					// Continue with database deletion even if Cloudinary deletion fails
				}
			}
		} catch (error) {
			console.error("Error processing Cloudinary deletion:", error);
			// Continue with database deletion
		}

		// Delete the image record from the database
		await image.destroy();

		res
			.status(200)
			.json({ Status: 1, message: "The Image deleted successfully" });
	} catch (error) {
		console.error("Error deleting image:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const deleteIngredient = async (req, res) => {
	try {
		const { ingredientId } = req.body;

		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		// Find the ingredient by ID
		const ingredient = await db.Ingrediant.findByPk(ingredientId);
		if (!ingredient) {
			return res
				.status(404)
				.json({ Status: 0, message: "Ingredient not found" });
		}

		// Delete the ingredient from the database
		await ingredient.destroy();

		res
			.status(200)
			.json({ Status: 1, message: "Ingredient deleted successfully" });
	} catch (error) {
		console.error("Error deleting ingredient:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const deleteItem = async (req, res) => {
	try {
		const user_id = req.userData.user_id;

		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const { itemId } = req.body;

		// Find the item by ID
		const item = await db.Items.findByPk(itemId);
		if (!item) {
			return res.status(404).json({ Status: 0, message: "The Item not found" });
		}

		// Delete images associated with the item
		await db.Item_Img.destroy({ where: { item_id: itemId } });

		// Delete ingredients associated with the item
		await db.Ingrediant.destroy({ where: { item_id: itemId } });

		// Delete the item
		await item.destroy();

		res
			.status(200)
			.json({ Status: 1, message: "The Item deleted successfully" });
	} catch (error) {
		console.error("Error deleting item:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const getCategoryList = async (req, res) => {
	try {
		let { page } = req.query;
		let { business_id } = req.userData;
		const pageSize = 20;
		let whereClause;

		const authHeader = req.headers["authorization"];
		if (!!authHeader) {
			const token = req.headers["authorization"].split(" ")[1];

			if (!token) {
				return res.status(401).json({ message: "Authentication failed " });
			}

			const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
			const user = await db.User.findByPk(decodedToken.userId);
			const tokens = await db.Token.findByPk(decodedToken.tokenId);
			if (
				!user ||
				!tokens ||
				tokens.tokenVersion !== decodedToken.tokenVersion
			) {
				return res.status(401).json({ error: "Invalid token" });
			}
			req.userData = user;
			req.tokenData = tokens;
			// next();
			const user_id = req.userData.user_id;

			const userx = await db.User.findOne({
				where: {
					[Op.and]: [
						{ user_id },
						{
							[Op.or]: [
								{ role: "admin" },
								{ role: "supervisor" },
								{ role: "waiter" },
								{ role: "barista" },
							],
						},
					],
				},
			});
			if (!userx) {
				return res
					.status(404)
					.json({ Status: 0, message: "The User Not Found" });
			}
			whereClause = { business_id: user.business_id };
			if (user.role === "user") {
				if (!req.body.business_id) {
					return res
						.status(400)
						.json({ Status: 0, message: "business_id require for user" });
				}
				whereClause = { business_id };
			}
		} else {
			if (!req.body.business_id) {
				return res
					.status(400)
					.json({ Status: 0, message: "business_id require for user" });
			}
			whereClause = { business_id };
		}

		page = parseInt(page, 10) || 1;
		if (page < 1) {
			page = 1;
		}
		const offset = (page - 1) * pageSize;

		let { count, rows } = await db.Category.findAndCountAll({
			where: whereClause,
			attributes: ["category_id", "category_name"], // Select only the necessary attributes
			distinct: true,
			limit: pageSize,
			offset: offset,
		});
		const totalPages = Math.ceil(count / pageSize);
		// Return the list of categories in the response
		res.status(200).json({
			Status: 1,
			message: "The Category get Succesfully",
			current_page: page,
			total_pages: totalPages,
			categories: rows,
		});
	} catch (error) {
		console.error("Error fetching category list:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const getItemList = async (req, res) => {
	try {
		let { category_id, page, business_id } = req.query;
		const pageSize = 20;
		let whereClause;

		console.log(req.query, "Fetching item list with filters:", req.body);
		const authHeader = req.headers["authorization"];
		if (!!authHeader) {
			const token = req.headers["authorization"].split(" ")[1];

			if (!token) {
				return res.status(401).json({ message: "Authentication failed " });
			}

			const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
			const user = await db.User.findByPk(decodedToken.userId);
			const tokens = await db.Token.findByPk(decodedToken.tokenId);
			if (
				!user ||
				!tokens ||
				tokens.tokenVersion !== decodedToken.tokenVersion
			) {
				return res.status(401).json({ error: "Invalid token" });
			}
			req.userData = user;
			req.tokenData = tokens;
			// next();
			const user_id = req.userData.user_id;

			const userx = await db.User.findOne({
				where: {
					[Op.and]: [
						{ user_id },
						{
							[Op.or]: [
								{ role: "admin" },
								{ role: "supervisor" },
								{ role: "waiter" },
								{ role: "barista" },
							],
						},
					],
				},
			});
			if (!userx) {
				return res
					.status(404)
					.json({ Status: 0, message: "The User Not Found" });
			}
			whereClause = { business_id: user.business_id };
			if (user.role === "user") {
				if (!req.body.business_id) {
					return res
						.status(400)
						.json({ Status: 0, message: "business_id require for user" });
				}
				whereClause = { business_id };
			}
		} else {
			if (!req.body.business_id) {
				return res
					.status(400)
					.json({ Status: 0, message: "business_id require for user" });
			}
			whereClause = { business_id };
		}

		page = parseInt(page, 10) || 1;
		if (page < 1) {
			page = 1;
		}

		// Calculate the offset based on the current page and page size
		const offset = (page - 1) * pageSize;
		let { count, rows } = await db.Items.findAndCountAll({
			where: whereClause,
			include: [
				{
					model: db.Business,
					required: true,
				},
				{
					model: db.Item_Img,
					// required: true,
				},
				{
					model: db.Ingrediant,
					required: true,
				},
				{
					model: db.Category,
					where: { category_id },
					required: true,
				},
			],
			distinct: true,
			limit: pageSize,
			offset: offset,
		});
		const totalPages = Math.ceil(count / pageSize);
		res.status(200).json({
			Status: 1,
			message: "The ItemList get succesfully",
			current_page: page,
			total_pages: totalPages,
			data: rows,
		});
	} catch (error) {
		console.error("Error fetching item list:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const getItemDetails = async (req, res) => {
	try {
		const { itemId } = req.query;

		const itemList = await db.Items.findAll({
			where: { item_id: itemId },
			include: [
				{
					model: db.Item_Img,
					// required: true,
				},
				{
					model: db.Ingrediant,
					required: true,
				},
			],
		});

		// Return the item details along with its images and ingredients
		res
			.status(200)
			.json({ Status: 1, message: "The Item get succesfully", itemList });
	} catch (error) {
		console.error("Error fetching item details:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const addStaff = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const {
			first_name,
			last_name,
			// username,
			email,
			country_code,
			iso_code,
			phone_no,
			password,
		} = req.body;

		if (user.role !== "admin" && user.role !== "supervisor") {
			return res.status(401).json({ Status: 0, message: "Unauthorized" });
		}
		// const same_username = await db.User.findOne({
		//   where: {
		//     [Op.or]: [{ username }, { email }],
		//   },
		// });
		// if (!!same_username) {
		//   return res
		//     .status(201)
		//     .json({ Status: 0, message: "This email already Exist" });
		// }
		const same_email = await db.User.findOne({
			where: { email },
		});
		if (!!same_email) {
			return res
				.status(201)
				.json({ Status: 0, message: "This email already Exist" });
		}
		let role;
		if (user.role === "admin") {
			// Admin can add waiter, barista, or supervisor
			role = req.body.role; // Assuming role is passed in the request body
			// Currently allowing admin to add 'user' role as well
			if (!["waiter", "barista", "supervisor", "user"].includes(role)) {
				return res.status(400).json({ Status: 0, message: "Invalid role" });
			}
		} else {
			// Supervisor can add only waiter or barista
			role = req.body.role; // Assuming role is passed in the request body
			// Currently allowing supervisor to add 'user' role as well
			if (!["waiter", "barista", "user"].includes(role)) {
				return res.status(400).json({ Status: 0, message: "Invalid role" });
			}
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		// Create the staff member in the database
		const newStaff = await db.User.create({
			business_id: user.business_id,
			first_name,
			last_name,
			// username,
			email,
			country_code,
			iso_code,
			phone_no,
			role,
			password: hashedPassword,
		});

		res.status(201).json({
			Status: 1,
			message: "The Staff Added Successfully",
			staff: newStaff,
		});
	} catch (error) {
		console.error("Error adding staff:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const getStaffList = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		console.log("req.userData", req.userData);
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		let { page, role } = req.body;
		console.log("Request Body:", req.body);
		const pageSize = 20;
		const businessId = user.business_id;
		// Parse the page parameter and ensure it's a positive integer
		page = parseInt(page, 10) || 1;
		if (page < 1) {
			page = 1;
		}

		// Calculate the offset based on the current page and page size
		const offset = (page - 1) * pageSize;

		// Fetch staff members based on the provided role and business ID
		let { count, rows } = await db.User.findAndCountAll({
			where: {
				business_id: businessId,
				role: role,
			},
			distinct: true,
			limit: pageSize,
			offset: offset,
		});
		const totalPages = Math.ceil(count / pageSize);
		res.status(200).json({
			Status: 1,
			message: "Get Staff List successfully",
			current_page: page,
			total_pages: totalPages,
			staffList: rows,
		});
	} catch (error) {
		console.error("Error fetching staff list:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const getStaffMemberDetail = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const staffMemberId = req.query.staffMemberId || null; // Get staff member ID from URL params
		console.log(req.query.staffMemberId, "Staff Member ID:", staffMemberId);
		const staffMember = await db.User.findOne({
			where: {
				user_id: staffMemberId,
				business_id: user.business_id,
			},
		});

		if (!staffMember) {
			return res
				.status(404)
				.json({ Status: 0, message: "The Staff member not found" });
		}

		res.status(200).json({
			Status: 1,
			message: "Get Staff Member Detail successfully",
			staffMember,
		});
	} catch (error) {
		console.error("Error fetching staff member detail:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const editStaffProfile = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const {
			staffMemberId,
			first_name,
			last_name,
			username,
			email,
			country_code,
			iso_code,
			phone_no,
			password,
		} = req.body;

		// Check if the staff member belongs to the same business as the user
		const staffMember = await db.User.findOne({
			where: {
				user_id: staffMemberId,
				business_id: user.business_id,
			},
		});

		if (!staffMember) {
			return res
				.status(404)
				.json({ Status: 0, message: "The Staff member not found" });
		}
		let hashedPassword;
		if (!!password) {
			hashedPassword = await bcrypt.hash(password, 10);
		}
		// Update staff member's profile
		const updatedStaffProfile = await staffMember.update({
			first_name,
			last_name,
			username,
			email,
			country_code,
			iso_code,
			phone_no,
			password: hashedPassword,
		});

		res.status(200).json({
			Status: 1,
			message: "The Staff profile Updated successfully",
			updatedStaffProfile,
		});
	} catch (error) {
		console.error("Error editing staff profile:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const deleteStaff = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = req.userData;
		// const user = await db.User.findOne({
		//   where: {
		//     user_id,
		//     role: {
		//       [Op.or]: ['admin', 'supervisor'],
		//     },
		//   },
		// });

		// if (!user) {
		//   return res.status(404).json({ Status: 0, message: "The User Not Found" });
		// }
		console.log(req.userData.role != "admin");
		console.log(req.userData.role != "supervisor");
		console.log(
			req.userData.role != "admin" && req.userData.role != "supervisor"
		);
		if (req.userData.role != "admin" && req.userData.role != "supervisor") {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const { staffMemberId } = req.body;

		const staffMember = await db.User.findOne({
			where: {
				user_id: staffMemberId,
				business_id: user.business_id,
			},
		});

		if (!staffMember) {
			return res
				.status(404)
				.json({ Status: 0, message: "The Staff member not found" });
		}

		if (staffMember.role == "barista") {
			console.log(" im a brista...................................");
			await db.Order.update(
				{ barista_id: null },
				{ where: { barista_id: staffMemberId } }
			);
		} else if (staffMember.role == "waiter") {
			console.log(" im a waiter...................................");

			await db.Order.update(
				{ waiter_id: null },
				{ where: { waiter_id: staffMemberId } }
			);

			await db.Waiter.destroy({
				where: { user_id: staffMemberId },
			});
		}

		await db.Contact_Us.destroy({
			where: { user_id: staffMemberId },
		});

		await db.Notification.destroy({
			where: {
				[Op.or]: [
					{ notification_from: staffMemberId },
					{ notification_to: staffMemberId },
				],
			},
		});

		await staffMember.destroy();

		res
			.status(200)
			.json({ Status: 1, message: "The Staff member deleted successfully" });
	} catch (error) {
		console.error("Error deleting staff member:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const addTable = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const { table_no } = req.body;
		const existTable = await db.Tables.findOne({
			where: {
				business_id: user.business_id,
				table_no,
				is_deleted: false,
			},
		});
		if (!!existTable) {
			return res
				.status(201)
				.json({ Status: 0, message: `Table ${table_no} already exist` });
		} else {
			// Create the table
			var table = await db.Tables.create({
				business_id: user.business_id,
				table_no,
			});
		}
		res
			.status(201)
			.json({ Status: 1, message: "The Table added successfully", table });
	} catch (error) {
		console.error("Error adding table:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const getTableList = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		let { page } = req.query;
		const pageSize = 20;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		page = parseInt(page, 10) || 1;
		if (page < 1) {
			page = 1;
		}
		const offset = (page - 1) * pageSize;
		const businessId = user.business_id;

		// Fetch all tables associated with the user's business ID
		let { count, rows } = await db.Tables.findAndCountAll({
			where: {
				business_id: businessId,
			},
			distinct: true,
			limit: pageSize,
			offset: offset,
		});
		if (!rows) {
			return res.status(200).json({ Status: 0, message: "Address not found" });
		}
		const totalPages = Math.ceil(count / pageSize);
		res.status(200).json({
			Status: 1,
			message: "Get Table List Succesfully",
			current_page: page,
			total_pages: totalPages,
			tables: rows,
		});
	} catch (error) {
		console.error("Error fetching table list:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const removeTable = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const { table_ids } = req.query;
		console.log("table_ids", table_ids, req.query);
		const tableIdsArray = table_ids.split(",").map((id) => id.trim());

		// Soft delete in the table format
		//  We are setting is_deleted to true instead of removing the record because waiter is assigned to the table and orders are also associated with the table.
		//  This way we maintain data integrity and can still track historical data.
		//  If we were to hard delete, it could lead to orphaned records in related tables.
		await db.Tables.update(
			{ is_deleted: true },
			{
				where: {
					table_id: tableIdsArray,
					business_id: user.business_id,
				},
			}
		);

		// for (const tableId of tableIdsArray) {
		// 	await db.Waiter.destroy({ where: { table_id: tableId } });

		// 	await db.Order.update(
		// 		{ table_id: null },
		// 		{ where: { table_id: tableId } }
		// 	);
		// }
		// // Find and destroy the tables with the provided table_ids
		// await db.Tables.destroy({
		// 	where: {
		// 		table_id: tableIdsArray,
		// 		business_id: user.business_id,
		// 	},
		// });

		res
			.status(200)
			.json({ Status: 1, message: "The Tables removed successfully" });
	} catch (error) {
		console.error("Error removing tables:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const assignWaiterToTables = async (req, res) => {
	try {
		const userId = req.userData.user_id; // Verify the user's token
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: userId },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const { user_id, table_ids } = req.body;

		const waiterfound = await db.User.findByPk(user_id);
		console.log("waiterfound", waiterfound);
		if (!(waiterfound.role == "waiter")) {
			return res
				.status(404)
				.json({ Status: 0, message: "The waiter not found" });
		}
		// Split the table_ids string into an array of integers
		const tableIdsArray = table_ids.split(",").map(Number);

		// Find all the tables corresponding to the provided table_ids
		const tables = await db.Tables.findAll({
			where: { table_id: tableIdsArray },
		});

		// Check if any tables were found
		if (tables.length === 0) {
			return res
				.status(404)
				.json({ Status: 0, message: "No valid tables found" });
		}

		// Filter out the table IDs that do not exist
		const existingTableIds = tables.map((table) => table.table_id);

		// Find the existing waiter-table assignments
		const existingAssignments = await db.Waiter.findAll({
			where: { table_id: existingTableIds },
		});

		// if already assigned table to waiter
		if (existingAssignments.length > 0) {
			return res
				.status(201)
				.json({ Status: 0, message: "The Table already assigned to waiter" });
		}

		// Extract the table IDs that are already assigned to the waiter
		const assignedTableIds = existingAssignments.map(
			(assignment) => assignment.table_id
		);

		// Create entries in the waiter table for each user-table pair using a for loop
		for (const table_id of existingTableIds) {
			if (!assignedTableIds.includes(table_id)) {
				await db.Waiter.create({ user_id, table_id });
				// Update is_assigned_to_waiter in Tables
				await db.Tables.update(
					{ is_assigned_to_waiter: true },
					{ where: { table_id } }
				);
			}
		}

		// Update is_assigned_to_waiter in Tables

		res.status(201).json({
			Status: 1,
			message: "The Waiters assigned to tables successfully",
		});
	} catch (error) {
		console.error("Error assigning waiter to tables:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const editAssignWaiterToTable = async (req, res) => {
	try {
		const userId = req.userData.user_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: userId },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const { user_id, table_ids } = req.body;

		const waiterFound = await db.User.findByPk(user_id);
		if (!waiterFound || waiterFound.role !== "waiter") {
			return res
				.status(404)
				.json({ Status: 0, message: "The waiter not found" });
		}

		const tableIdsArray = table_ids.split(",").map(Number);

		// Find all the tables corresponding to the provided table_ids
		const tables = await db.Tables.findAll({
			where: { table_id: tableIdsArray, business_id: user.business_id },
		});

		if (tables.length === 0) {
			return res
				.status(404)
				.json({ Status: 0, message: "No valid tables found" });
		}

		const validTableIds = tables.map((table) => table.table_id);

		// Check for existing assignments to other waiters
		// Remove all previous assignments for these tables
		await db.Waiter.destroy({ where: { table_id: validTableIds } });

		// Assign each table to the waiter (user_id)
		const insertionPromises = validTableIds.map((table_id) =>
			db.Waiter.create({ user_id, table_id })
		);
		await Promise.all(insertionPromises);

		res.status(200).json({
			Status: 1,
			message: "The Waiter assigned to tables successfully",
		});
	} catch (error) {
		console.error("Error editing waiter-table assignments:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const waitersTableList = async (req, res) => {
	try {
		const userId = req.userData.user_id; // Verify the user's token
		let { page } = req.query;

		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: userId },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});

		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		const waiterId = req.query.waiterId;

		// Verify if the user is a waiter
		const waiter = await db.User.findOne({
			where: {
				user_id: waiterId,
				role: "waiter",
			},
		});
		if (!waiter) {
			return res
				.status(404)
				.json({ Status: 0, message: "The Waiter not found" });
		}
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		let { count, rows } = await db.Tables.findAndCountAll({
			where: {
				business_id: waiter.business_id,
			},
			attributes: ["table_id", "business_id", "table_no"],
			include: [
				{
					model: db.Waiter,
					required: true,
					where: { user_id: waiterId },
					attributes: ["user_id", "table_id", "id"],
					include: [
						{
							model: db.User,
							// required: true,
							// where: {user_id: waiterId,},
							attributes: [
								"user_id",
								"first_name",
								"last_name",
								"email",
								"phone_no",
								"role",
							],
						},
					],
				},
			],
			// raw:true,
			distinct: true,
			// group: ["Tables_model.table_id"],
			limit: pageSize,
			offset,
		});
		if (!rows) {
			return res.status(200).json({ Status: 0, message: "tables not found" });
		}
		const totalPages = Math.ceil(count / pageSize);
		res.status(200).json({
			Status: 1,
			message: "The Waiter Assigned Table List Get Successfully",
			current_page: currentPage,
			total_pages: totalPages,
			tables: rows,
		});
	} catch (error) {
		console.error("Error fetching waiter assigned table list:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const is_admin = async (req, res) => {
	try {
		if (req.userData.role != "admin" && req.userData.role != "supervisor") {
			return res.status(400).json({
				Status: 0,
				message: "You are not authorized to perform this action",
			});
		}
	} catch (error) {
		console.error("Error checking user:", error);
		return res
			.status(500)
			.json({ Status: 0, message: "Internal server error" });
	}
};
const addPromoCode = async (req, res) => {
	try {
		const { code, name, description, discount, expiresAt } = req.body;
		const { business_id, user_id } = req.userData;
		await is_admin(req, res);

		const existingPromoCode = await db.PromoCode.findOne({
			where: {
				code: { [Op.eq]: db.Sequelize.literal(`BINARY '${req.body.code}'`) },
				business_id,
			},
		});

		if (existingPromoCode && existingPromoCode.code === req.body.code) {
			return res
				.status(400)
				.json({ Status: 0, message: "Promo code already exists" });
		}

		// Set expiresAt time to 23:59:59
		let expiresDate = new Date(expiresAt);
		expiresDate.setHours(23, 59, 59, 999);

		const newPromoCode = await db.PromoCode.create({
			name,
			code,
			description,
			discount,
			expiresAt: expiresDate,
			isActive: true,
			business_id,
			user_id,
		});

		return res.status(200).json({
			Status: 1,
			message: "Promo code added successfully",
			promoCode: newPromoCode,
		});
	} catch (error) {
		console.error("Error on adding promo code ", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const getPromoCodes = async (req, res) => {
	try {
		await is_admin(req, res);

		const pageSize = 20;
		let currentPage = parseInt(req.query.page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		const { count, rows } = await db.PromoCode.findAndCountAll({
			attributes: { exclude: ["createdAt", "updatedAt"] }, // Exclude password from the result
			where: { business_id: req.userData.business_id },
			limit: pageSize,
			offset,
			order: [["createdAt", "DESC"]],
		});

		const promoCodes = await Promise.all(
			rows.map((promoCode) => {
				const isExpired = new Date(promoCode.expiresAt) <= new Date();
				return {
					...promoCode.dataValues,
					isExpired,
				};
			})
		);
		const totalPages = Math.ceil(count / pageSize);
		return res.status(200).json({
			Status: 1,
			message: "Promo codes retrieved successfully",
			current_page: currentPage,
			total_pages: totalPages,
			data: promoCodes,
		});
	} catch (error) {
		console.error("Error on fetching promo codes:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const deletePromoCode = async (req, res) => {
	try {
		const { promoCode_id } = req.body;
		const { business_id } = req.userData;
		await is_admin(req, res);

		const promoCode = await db.PromoCode.findOne({
			where: { promoCode_id, business_id },
		});
		if (!promoCode) {
			return res
				.status(404)
				.json({ Status: 0, message: "Promo code not found" });
		}

		await promoCode.destroy();

		return res
			.status(200)
			.json({ Status: 1, message: "Promo code deleted successfully" });
	} catch (error) {
		console.error("Error on deleting promo code:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const orderHistory = async (req, res) => {
	try {
		const { page } = req.body;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		let condition = {};
		let total_amount = null;
		switch (req.userData.role) {
			case "user":
				console.log("im in user order history");
				console.log("req.query", req.query);
				var searchCondition = {};
				if (req.body.search_text) {
					searchCondition.business_name = {
						[Op.like]: `%${req.query.search_text}%`, // Example condition
					};
				}
				condition = {
					[Op.and]: [
						{
							user_id: req.userData.user_id,
						},
						{ order_status: "complete" },
					],
				};
				break;
			case "waiter":
				condition = {
					[Op.and]: [
						{ waiter_id: req.userData.user_id },
						{ order_status: "complete" },
					],
				};
				break;
			case "admin":
			case "supervisor":
				condition = {
					[Op.and]: [
						{ business_id: req.userData.business_id },
						{ order_status: "complete" },
					],
				};
				(async () => {
					const orderTotalAmount = await db.Order.findOne({
						where: condition,
						attributes: [
							[
								db.sequelize.fn("SUM", db.sequelize.col("total_price")),
								"total_amount",
							],
						],
					});

					total_amount = orderTotalAmount.get("total_amount");
				})();

				break;
			default:
				return res
					.status(400)
					.json({ status: 0, message: "Invalid field value" });
		}
		const { count, rows } = await db.Order.findAndCountAll({
			where: condition,
			include: [
				{
					model: db.Order_Item,
					required: true,
				},
				{
					model: db.User,
					attributes: ["user_id", "username", "first_name", "last_name"],
					required: false,
				},
				{
					model: db.Business,
					required: true,
					where: searchCondition,
				},
			],
			distinct: true,
			limit: pageSize,
			offset,
			order: [["updatedAt", "DESC"]],
		});
		const totalPages = Math.ceil(count / pageSize);
		res.status(200).json({
			Status: 1,
			message: "OrderDetails get successfully",
			current_page: currentPage,
			total_pages: totalPages,
			total_amount,
			OrderDetails: rows,
		});
	} catch (error) {
		console.error("Error fetching order Details:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const orderDetails = async (req, res) => {
	try {
		const { order_id } = req.query;

		const is_exist = await db.Order.findByPk(order_id);
		if (!is_exist) {
			return res.status(404).json({ Status: 0, message: "Order not found" });
		}
		const OrderDetails = await db.Order.findOne({
			where: {
				order_id: req.query.order_id,
			},
			include: [
				{
					model: db.Order_Item,
					required: true,
				},
				{
					model: db.User,
					attributes: ["user_id", "username", "first_name", "last_name"],
					required: false,
				},
				{
					model: db.Business,
					required: false,
				},
			],
		});
		res.status(200).json({
			Status: 1,
			message: "OrderDetails get successfully",
			OrderDetails,
		});
	} catch (error) {
		console.error("Error fetching order Details:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const notificationList = async (req, res) => {
	try {
		const user_id = req.userData.user_id;

		const { page } = req.query;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		const { count, rows } = await db.Notification.findAndCountAll({
			where: { notification_to: user_id },
			// include: [
			//     {
			//         model: db.User,
			//         // attributes: ['user_id', 'first_name', 'last_name', 'username', 'profile_image'],
			//         required: true,
			//         as: "notificationSender",
			//     },
			//     {
			//         model: db.User,
			//         // attributes: ['user_id', 'first_name', 'last_name', 'username', 'profile_image'],
			//         required: true,
			//         as: "notificationReceiver"
			//     }
			// ],
			distinct: true,
			limit: pageSize,
			offset,
			order: [["createdAt", "ASC"]],
		});

		// const notificationIds = rows.map(notification => notification.id);
		// if (notificationIds.length > 0) {
		//   await db.Notification.update(
		//     { message_status: "Read" },
		//     {
		//       where: {
		//         notification_id: notificationIds,
		//         message_status: "Unread"
		//       }
		//     }
		//   );
		// }

		const totalPages = Math.ceil(count / pageSize);
		await db.Notification.update(
			{ status: "Read" },
			{ where: { notification_to: user_id, status: "Unread" } }
		);
		res.status(200).json({
			Status: 1,
			message: "Notifications fetched successfully",
			currentPage,
			totalPages,
			data: rows,
		});
	} catch (error) {
		console.error("Error getting notificationList:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const getProfileDetails = async (req, res) => {
	try {
		const user_id = req.userData.user_id;

		// Find the user profile details
		const userProfile = await db.User.findOne({
			where: { user_id },
			attributes: { exclude: ["password"] }, // Exclude password from the result
			include: [
				{
					model: db.Business,
				},
			],
		});

		if (!userProfile) {
			return res
				.status(404)
				.json({ Status: 0, message: "The User profile not found" });
		}

		let notificationCount = await db.Notification.count({
			where: { notification_to: user_id, status: "Unread" },
		});
		// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>im in notification count emit", notificationCount);
		// const info = {
		//     notificationCount
		// }
		// await emitToSockets(userId, "notification_count", info);

		res.status(200).json({
			Status: 1,
			message: "The User profile details retrieved successfully",
			userProfile,
			notificationCount,
		});
	} catch (error) {
		console.error("Error fetching user profile:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};
const getBusinessProfile = async (req, res) => {
	try {
		const user_id = req.userData.user_id;

		// Verify user and check if the user is an admin
		const user = await db.User.findOne({
			where: { user_id, role: "admin" },
		});

		if (!user) {
			return res
				.status(401)
				.json({ status: 0, message: "Unauthorized access" });
		}

		// Get business profile data where business_id matches user's business_id
		const businessProfile = await db.Business.findAll({
			where: { business_id: user.business_id },
		});

		if (!businessProfile) {
			return res
				.status(404)
				.json({ status: 0, message: "The Business profile not found" });
		}

		res.status(200).json({
			status: 1,
			message: "The Business profile details retrieved successfully",
			businessProfile,
		});
	} catch (error) {
		console.error("Error fetching business profile:", error);
		res.status(500).json({ status: 0, message: "Internal Server Error" });
	}
};
const contactUs = async (req, res) => {
	try {
		const { subjects, message } = req.body;
		const user_id = req.userData.user_id; // Assuming user_id is extracted from token

		const user = await db.User.findOne({ where: { user_id } });
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}
		const newContact = await db.Contact_Us.create({
			user_id,
			subjects,
			message,
		});
		userDetails = {
			subjects: subjects,
			message: message,
			fullName: `${user.first_name} ${user.last_name}`,
			email: user.email,
			role: user.role,
		};
		await common_fun.sendContactUsEmail(userDetails);
		res.status(201).json({
			Status: 1,
			message: "Contact Us Add Successfully",
			contactDetails: newContact,
		});
	} catch (error) {
		console.error("Error storing contact details:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

const filter = async (req, res) => {
	try {
		const current_user_id = req.userData.user_id;
		const business_id = req.userData.business_id;
		const user = await db.User.findOne({
			where: {
				[Op.and]: [
					{ user_id: current_user_id },
					{ [Op.or]: [{ role: "admin" }, { role: "supervisor" }] },
				],
			},
		});
		if (!user) {
			return res.status(404).json({ Status: 0, message: "The User Not Found" });
		}

		// Get filter params
		const {
			page,
			order_status,
			order_type,
			bill_status,
			sort_by,
			sort_order,
			field,
			start_date,
			end_date,
			select_date,
		} = req.query;
		const pageSize = 20;
		let currentPage = parseInt(page, 10) || 1;
		if (currentPage < 1) currentPage = 1;
		const offset = (currentPage - 1) * pageSize;

		// Build filter
		let where = { business_id };
		// Date filter logic (same as previous filter)
		if (field) {
			switch (field) {
				case "today":
					where.createdAt = {
						[Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
						[Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
					};
					break;
				case "previous_day":
					const yesterday = new Date();
					yesterday.setDate(yesterday.getDate() - 1);
					where.createdAt = {
						[Op.gte]: new Date(yesterday.setHours(0, 0, 0, 0)),
						[Op.lt]: new Date(yesterday.setHours(23, 59, 59, 999)),
					};
					break;
				case "this_month":
					where.createdAt = {
						[Op.gte]: new Date(
							new Date().getFullYear(),
							new Date().getMonth(),
							1
						),
						[Op.lt]: new Date(
							new Date().getFullYear(),
							new Date().getMonth() + 1,
							0,
							23,
							59,
							59,
							999
						),
					};
					break;
				case "last_month":
					where.createdAt = {
						[Op.gte]: new Date(
							new Date().getFullYear(),
							new Date().getMonth() - 1,
							1
						),
						[Op.lt]: new Date(
							new Date().getFullYear(),
							new Date().getMonth(),
							0,
							23,
							59,
							59,
							999
						),
					};
					break;
				case "this_year":
					where.createdAt = {
						[Op.gte]: new Date(new Date().getFullYear(), 0, 1),
						[Op.lt]: new Date(
							new Date().getFullYear(),
							11,
							31,
							23,
							59,
							59,
							999
						),
					};
					break;
				case "last_year":
					where.createdAt = {
						[Op.gte]: new Date(new Date().getFullYear() - 1, 0, 1),
						[Op.lt]: new Date(
							new Date().getFullYear() - 1,
							11,
							31,
							23,
							59,
							59,
							999
						),
					};
					break;
				case "custom":
					if (start_date && end_date) {
						where.createdAt = {
							[Op.gte]: new Date(start_date),
							[Op.lt]: new Date(end_date),
						};
					}
					break;
				case "select_date":
					if (select_date) {
						where.createdAt = {
							[Op.gte]: new Date(select_date),
							[Op.lt]: new Date(
								new Date(select_date).setHours(23, 59, 59, 999)
							),
						};
					}
					break;
				default:
					return res
						.status(400)
						.json({ Status: 0, message: "Invalid field value" });
			}
		}

		// Other filters
		if (order_status && order_status !== "all") {
			where.order_status = order_status;
		} else {
			where.order_status = "complete";
		}
		if (order_type && order_type !== "all") {
			where.order_type = order_type;
		}
		if (bill_status && bill_status !== "all") {
			where.bill_status = bill_status;
		}

		// Sorting
		let orderArr = [["updatedAt", "DESC"]];
		if (sort_by) {
			const validSortOrder =
				sort_order && ["ASC", "DESC"].includes(sort_order.toUpperCase())
					? sort_order.toUpperCase()
					: "DESC";
			orderArr = [[sort_by, validSortOrder]];
		}

		// Query orders
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
			order: orderArr,
		});

		// Fetch ingrediant data for each order item
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

		// Calculate total_amount
		let total_amount = null;
		const totalAmountResult = await db.Order.findAll({
			where,
			attributes: [
				[
					db.sequelize.fn("SUM", db.sequelize.col("total_price")),
					"total_amount",
				],
			],
			raw: true,
		});
		total_amount = totalAmountResult[0].total_amount;

		const totalPages = Math.ceil(count / pageSize);

		return res.status(200).json({
			Status: 1,
			message: "Order list fetched successfully",
			current_page: currentPage,
			total_pages: totalPages,
			orders: rows,
			total_orders: count,
			total_amount,
		});
	} catch (error) {
		console.error("Error in filter:", error);
		res.status(500).json({ Status: 0, message: "Internal Server Error" });
	}
};

module.exports = {
	signin,
	otp_verify,
	forgetPassword,
	StaffForgetPassword,
	resetPassword,
	businessHours,

	addCategory,
	editCategory,
	deleteCategory,

	addItem,
	editItem,
	deleteItemImage,
	deleteIngredient,
	deleteItem,

	getCategoryList,
	getItemList,
	getItemDetails,

	addStaff,
	getStaffList,
	editStaffProfile,
	deleteStaff,
	getStaffMemberDetail,

	addTable,
	getTableList,
	removeTable,
	assignWaiterToTables,
	editAssignWaiterToTable,
	waitersTableList,
	getProfileDetails,
	getBusinessProfile,
	contactUs,
	changePassword,
	signOut,

	addPromoCode,
	getPromoCodes,
	deletePromoCode,

	filter,
	orderHistory,
	orderDetails,
	notificationList,
};

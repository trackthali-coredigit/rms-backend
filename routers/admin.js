const express = require("express");
const router = express.Router();
const multer = require("multer");
// Use memory storage for Cloudinary uploads
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 4 * 1024 * 1024, // 4MB limit
	},
});
const { check, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth_middleware");
console.log("im in admin.js router");
const fs = require("fs");
let validation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};
const admin = require("../controllers/admin");

// ------------------------------------------------Auth Routes------------------------------------------------//
/**
 * @swagger
 * /signin:
 *   post:
 *     summary: Admin sign in
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *               password:
 *                 type: string
 *               device_id:
 *                 type: string
 *               device_type:
 *                 type: string
 *               device_token:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       400:
 *         description: Validation error
 */

router.post(
	"/signin",
	[
		check("emailOrUsername")
			.not()
			.isEmpty()
			.withMessage("Email or username is required")
			.trim()
			.escape(),
		check("password")
			.not()
			.isEmpty()
			.withMessage("Password is required")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters long")
			.trim()
			.escape(),
		check("device_id")
			.not()
			.isEmpty()
			.withMessage("Device ID is required")
			.trim()
			.escape(),
		check("device_type")
			.not()
			.isEmpty()
			.withMessage("Device type is required")
			.trim()
			.escape(),
		check("device_token")
			.not()
			.isEmpty()
			.withMessage("Device token is required")
			.trim()
			.escape(),
		check("role")
			.not()
			.isEmpty()
			.withMessage("Role is required")
			.trim()
			.escape(),
	],
	validation,
	admin.signin
);
/**
 * @swagger
 * /otp_verify:
 *   post:
 *     summary: Verify OTP for admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *               otp:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Validation error
 */
router.post(
	"/otp_verify",
	[
		check("emailOrUsername")
			.not()
			.isEmpty()
			.withMessage("Email or username is required")
			.trim()
			.escape(),
		check("otp").not().isEmpty().withMessage("OTP is required").trim().escape(),
		check("role")
			.not()
			.isEmpty()
			.withMessage("Role is required")
			.trim()
			.escape(),
	],
	validation,
	admin.otp_verify
);
/**
 * @swagger
 * /forgetPassword:
 *   post:
 *     summary: Admin forget password
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       400:
 *         description: Validation error
 */
router.post(
	"/forgetPassword",
	[
		check("emailOrUsername")
			.not()
			.isEmpty()
			.withMessage("Email or username is required")
			.trim()
			.escape(),
	],
	validation,
	admin.forgetPassword
);
/**
 * @swagger
 * /StaffForgetPassword:
 *   put:
 *     summary: Staff forget password
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Validation error
 */
router.put(
	"/StaffForgetPassword",
	[
		check("user_id")
			.not()
			.isEmpty()
			.withMessage("user_id is required")
			.trim()
			.escape(),
		check("password")
			.not()
			.isEmpty()
			.withMessage("Password is required")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters long")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	admin.StaffForgetPassword
);
/**
 * @swagger
 * /resetPassword:
 *   post:
 *     summary: Admin reset password
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Validation error
 */
router.post(
	"/resetPassword",
	[
		check("emailOrUsername")
			.not()
			.isEmpty()
			.withMessage("Email or username is required")
			.trim()
			.escape(),
		check("newPassword")
			.not()
			.isEmpty()
			.withMessage("New password is required")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters long")
			.trim()
			.escape(),
	],
	validation,
	admin.resetPassword
);
/**
 * @swagger
 * /changePassword:
 *   put:
 *     summary: Admin change password
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Validation error
 */
router.put(
	"/changePassword",
	[
		check("oldPassword")
			.not()
			.isEmpty()
			.withMessage("Old password is required")
			.trim()
			.escape(),
		check("newPassword")
			.not()
			.isEmpty()
			.withMessage("New password is required")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters long")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	admin.changePassword
);
/**
 * @swagger
 * /signOut:
 *   post:
 *     summary: Admin sign out
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Sign out successful
 *       400:
 *         description: Validation error
 */
router.post(
	"/signOut",
	// [
	//   check("device_id")
	//     .not()
	//     .isEmpty()
	//     .withMessage("Device ID is required")
	//     .trim()
	//     .escape(),
	// ],
	// validation,
	authMiddleware,
	admin.signOut
);

//------------------------------------------------Category Routes------------------------------------------------//
/**
 * @swagger
 * /addCategory:
 *   post:
 *     summary: Add a new category
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category added
 *       400:
 *         description: Validation error
 */
router.post(
	"/addCategory",
	[
		check("category_name")
			.not()
			.isEmpty()
			.withMessage("Category name is required")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	admin.addCategory
);

/**
 * @swagger
 * /editCategory:
 *   put:
 *     summary: Edit a category
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_id:
 *                 type: string
 *               category_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category edited
 *       400:
 *         description: Validation error
 */

router.put(
	"/editCategory",
	[
		check("category_id")
			.not()
			.isEmpty()
			.withMessage("Category ID is required")
			.trim()
			.escape(),
		check("category_name")
			.not()
			.isEmpty()
			.withMessage("Category name is required")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	admin.editCategory
);

/**
 * @swagger
 * /deleteCategory:
 *   delete:
 *     summary: Delete a category
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category deleted
 *       400:
 *         description: Validation error
 */
router.delete(
	"/deleteCategory",
	[
		check("category_id")
			.not()
			.isEmpty()
			.withMessage("Category ID is required")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	admin.deleteCategory
);

/**
 * @swagger
 * /getCategoryList:
 *   get:
 *     summary: Get category list
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         required: true
 *         description: Page number
 *     responses:
 *       200:
 *         description: Category list
 *       400:
 *         description: Validation error
 */

router.get(
	"/getCategoryList",
	[check("page").notEmpty().withMessage("page is required")],
	validation,
	authMiddleware,
	admin.getCategoryList
);

//------------------------------------------------Items Routes------------------------------------------------//
/**
 * @swagger
 * /addItem:
 *   post:
 *     summary: Add a new item
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               item_image:
 *                 type: string
 *                 format: binary
 *               item_name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               ingredients:
 *                 type: string
 *                 description: JSON stringified array of ingredient objects.
 *                 example: '[{"name":"mayo","price":21,"quantity":1}]'
 *               category_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added
 *       400:
 *         description: Validation error
 */
router.post(
	"/addItem",
	upload.fields([{ name: "item_image" }]),
	[
		check("item_image").custom((value, { req }) => {
			if (!req.files || !req.files.item_image) {
				throw new Error("Image is required");
			}
			if (req.files.item_image.length > 10) {
				req.files.item_image.forEach((element) => {
					fs.unlinkSync(element.path);
				});
				throw new Error("Maximum 10 images allowed");
			}
			return true;
		}),
		check("item_name")
			.not()
			.isEmpty()
			.withMessage("Item name is required")
			.trim()
			.escape(),
		check("price")
			.notEmpty()
			.withMessage("Price is required")
			.isFloat({ min: 0, max: 1000000 })
			.withMessage(
				"Price must be a non-negative number less than or equal to 1000000"
			),
		check("stock")
			.notEmpty()
			.withMessage("Stock is required")
			.isInt({ min: 0, max: 1000000 })
			.withMessage(
				"Stock must be a non-negative integer less than or equal to 1000000"
			),
		check("ingredients").optional().trim().escape(),
		check("category_id")
			.not()
			.isEmpty()
			.withMessage("Category ID is required")
			.trim()
			.escape()
			.isNumeric()
			.withMessage("Category ID must be a number"),
	],
	validation,
	authMiddleware,
	admin.addItem
);

/**
 * @swagger
 * /editItem:
 *   put:
 *     summary: Edit an item
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               item_id:
 *                 type: integer
 *                 required: true
 *               item_image:
 *                 type: string
 *                 format: binary
 *               item_name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               ingredients:
 *                 type: string
 *                 description: JSON stringified array of ingredient objects.
 *                 example: '[{"name":"mayo","price":21,"quantity":1}]'
 *               category_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item edited
 *       400:
 *         description: Validation error
 */
router.put(
	"/editItem",
	upload.fields([{ name: "item_image", maxCount: 10 }]),
	[
		check("item_id")
			.not()
			.isEmpty()
			.withMessage("Item ID is required")
			.trim()
			.escape()
			.isNumeric()
			.withMessage("Item ID must be a number"),
		check("item_name").optional().trim().escape(),
		check("price")
			.optional()
			.isFloat({ min: 0, max: 1000000 })
			.withMessage(
				"Price must be a non-negative number less than or equal to 1000000"
			),
		check("stock")
			.optional()
			.isInt({ min: 0, max: 1000000 })
			.withMessage(
				"Stock must be a non-negative integer less than or equal to 1000000"
			),
		check("ingredients").optional().trim().escape(),
		check("category_id")
			.optional()
			.trim()
			.escape()
			.isNumeric()
			.withMessage("Category ID must be a number"),
		check("item_image").custom((value, { req }) => {
			if (
				req.files &&
				req.files.item_image &&
				req.files.item_image.length > 10
			) {
				req.files.item_image.forEach((element) => {
					fs.unlinkSync(element.path);
				});
				throw new Error("Maximum 10 images allowed");
			}
			return true;
		}),
	],
	validation,
	authMiddleware,
	admin.editItem
);

/**
 * @swagger
 * /deleteItemImage:
 *   delete:
 *     summary: Delete an item image
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item image deleted
 *       400:
 *         description: Validation error
 */
router.delete(
	"/deleteItemImage",
	[
		check("imageId")
			.not()
			.isEmpty()
			.withMessage("Image ID is required")
			.trim()
			.escape()
			.isNumeric()
			.withMessage("Image ID must be a number"),
	],
	validation,
	authMiddleware,
	admin.deleteItemImage
);

/**
 * @swagger
 * /deleteIngredient:
 *   delete:
 *     summary: Delete an ingredient
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingredientId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ingredient deleted
 *       400:
 *         description: Validation error
 */
router.delete(
	"/deleteIngredient",
	[
		check("ingredientId")
			.not()
			.isEmpty()
			.withMessage("Ingredient ID is required")
			.trim()
			.escape()
			.isNumeric()
			.withMessage("Ingredient ID must be a number"),
	],
	validation,
	admin.deleteIngredient
);

/**
 * @swagger
 * /deleteItem:
 *   delete:
 *     summary: Delete an item
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item deleted
 *       400:
 *         description: Validation error
 */
router.delete(
	"/deleteItem",
	[
		check("itemId")
			.not()
			.isEmpty()
			.withMessage("item ID is required")
			.trim()
			.escape()
			.isNumeric()
			.withMessage("item ID must be a number"),
	],
	validation,
	authMiddleware,
	admin.deleteItem
);

/**
 * @swagger
 * /getItemList:
 *   get:
 *     summary: Get item list
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         required: true
 *         description: Page number
 *     responses:
 *       200:
 *         description: Item list
 *       400:
 *         description: Validation error
 */
router.get(
	"/getItemList",
	[
		check("category_id")
			.not()
			.isEmpty()
			.withMessage("Category ID is required")
			.trim()
			.escape()
			.isNumeric()
			.withMessage("Category ID must be a number"),
		check("page").notEmpty().withMessage("page is required"),
	],
	validation,
	admin.getItemList
);

/**
 * @swagger
 * /getItemDetails:
 *   get:
 *     summary: Get item details
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item details
 *       400:
 *         description: Validation error
 */

router.get(
	"/getItemDetails",
	[
		check("itemId")
			.not()
			.isEmpty()
			.withMessage("Item ID is required")
			.trim()
			.escape()
			.isNumeric()
			.withMessage("Item ID must be a number"),
	],
	validation,
	admin.getItemDetails
);

//------------------------------------------------Staff Routes------------------------------------------------//
/**
 * @swagger
 * /addStaff:
 *   post:
 *     summary: Add a new staff member
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_no:
 *                 type: string
 *               role:
 *                 type: string
 *               country_code:
 *                 type: string
 *               iso_code:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff member added successfully
 *       400:
 *         description: Validation error
 */
router.post(
	"/addStaff",
	[
		check("first_name")
			.not()
			.isEmpty()
			.withMessage("First name is required")
			.trim()
			.escape(),
		check("last_name")
			.not()
			.isEmpty()
			.withMessage("Last name is required")
			.trim()
			.escape(),
		check("username")
			.optional()
			.matches(/^[a-zA-Z0-9]+$/)
			.withMessage("Username must be a combination of letters and numbers")
			.trim()
			.escape(),
		check("email")
			.isEmail()
			.not()
			.isEmpty()
			.withMessage("email is required")
			.withMessage("Invalid email")
			.normalizeEmail(),
		check("country_code")
			.not()
			.isEmpty()
			.withMessage("Country code is required")
			.trim()
			.escape(),
		check("iso_code")
			.not()
			.isEmpty()
			.withMessage("ISO code is required")
			.trim()
			.escape(),
		check("phone_no")
			.not()
			.isEmpty()
			.withMessage("Phone number is required")
			.trim()
			.escape()
			.isNumeric()
			.withMessage("Phone number must be a number"),
		check("password")
			.not()
			.isEmpty()
			.withMessage("Password is required")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters long")
			.trim()
			.escape(),
		check("role")
			.not()
			.isEmpty()
			.withMessage("Role is required")
			.isIn(["super_admin", "admin", "waiter", "barista", "supervisor", "user"])
			.withMessage("Invalid role"),
	],
	validation,
	authMiddleware,
	admin.addStaff
);

/**
 * @swagger
 * /getStaffList:
 *   post:
 *     summary: Get a list of staff members
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 description: Role of the staff members to retrieve
 *               page:
 *                 type: integer
 *                 description: Page number
 *     responses:
 *       200:
 *         description: Staff list
 *       400:
 *         description: Validation error
 */
router.post(
	"/getStaffList",
	[
		check("role")
			.not()
			.isEmpty()
			.withMessage("Role is required")
			.isIn(["waiter", "barista", "supervisor"])
			.withMessage("Invalid role"),
		check("page").notEmpty().withMessage("page is required"),
	],
	validation,
	authMiddleware,
	admin.getStaffList
);

/**
 * @swagger
 * /editStaffProfile:
 *   put:
 *     summary: Edit staff profile
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_no:
 *                 type: string
 *               staffMemberId:
 *                 type: integer
 *               username:
 *                 type: string
 *               country_code:
 *                 type: string
 *               iso_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff profile updated successfully
 *       400:
 *         description: Validation error
 */
router.put(
	"/editStaffProfile",
	[
		check("staffMemberId")
			.not()
			.isEmpty()
			.withMessage("Staff member ID is required")
			.isNumeric()
			.withMessage("Staff member ID must be a number"),
	],
	validation,
	authMiddleware,
	admin.editStaffProfile
);

/**
 * @swagger
 * /deleteStaff:
 *   delete:
 *     summary: Delete a staff member
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: staffMemberId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the staff member to delete
 *     responses:
 *       200:
 *         description: Staff member deleted successfully
 *       400:
 *         description: Validation error
 */
router.delete(
	"/deleteStaff",
	[
		check("staffMemberId")
			.not()
			.isEmpty()
			.withMessage("Staff member ID is required")
			.isNumeric()
			.withMessage("Staff member ID must be a number"),
	],
	validation,
	authMiddleware,
	admin.deleteStaff
);

/**
 * @swagger
 * /getStaffMemberDetail:
 *   get:
 *     summary: Get staff member details
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: staffMemberId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the staff member to retrieve
 *     responses:
 *       200:
 *         description: Staff member details
 *       400:
 *         description: Validation error
 */
router.get(
	"/getStaffMemberDetail",
	[
		check("staffMemberId")
			.not()
			.isEmpty()
			.withMessage("Staff member ID is required")
			.isNumeric()
			.withMessage("Staff member ID must be a numeric value"),
	],
	validation,
	authMiddleware,
	admin.getStaffMemberDetail
);

//------------------------------------------------Table Routes------------------------------------------------//
/**
 * @swagger
 * /addTable:
 *   post:
 *     summary: Add a new table
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               table_no:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Table added successfully
 *       400:
 *         description: Validation error
 */
router.post(
	"/addTable",
	[
		check("table_no")
			.not()
			.isEmpty()
			.withMessage("Table number is required")
			.isNumeric()
			.withMessage("Table number must be a numeric value")
			.isLength({ max: 10 })
			.withMessage("Table number must be 10 Number long"),
	],
	validation,
	authMiddleware,
	admin.addTable
);

/**
 * @swagger
 * /getTableList:
 *   get:
 *     summary: Get a list of tables
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: true
 *         description: Page number for pagination
 *       - in: query
 *         name: is_assigned_to_waiter
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         required: false
 *         description: Filter by whether table is assigned to waiter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, reserved, occupied]
 *         required: false
 *         description: Filter by table status
 *     responses:
 *       200:
 *         description: List of tables
 *       400:
 *         description: Validation error
 */
router.get(
	"/getTableList",
	[
		check("page").notEmpty().withMessage("page is required"),
		check("is_assigned_to_waiter")
			.optional()
			.isIn(["true", "false"])
			.withMessage("is_assigned_to_waiter must be 'true' or 'false'"),
		check("status")
			.optional()
			.isIn(["available", "reserved", "occupied"])
			.withMessage("status must be 'available', 'reserved', or 'occupied'"),
	],
	validation,
	authMiddleware,
	admin.getTableList
);

/**
 * @swagger
 * /removeTable:
 *   delete:
 *     summary: Remove a table
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: table_ids
 *         schema:
 *           type: string
 *         required: true
 *         description: Comma-separated list of table IDs to remove
 *     responses:
 *       200:
 *         description: Table removed successfully
 *       400:
 *         description: Validation error
 */
router.delete(
	"/removeTable",
	[
		check("table_ids")
			.not()
			.isEmpty()
			.withMessage("Table IDs are required")
			.matches(/^\d+(,\d+)*$/)
			.withMessage("Table IDs must be comma-separated numbers"),
	],
	validation,
	authMiddleware,
	admin.removeTable
);

/**
 * @swagger
 * /assignWaiterToTables:
 *   post:
 *     summary: Assign a waiter to multiple tables
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               table_ids:
 *                 type: string
 *     responses:
 *       200:
 *         description: Waiter assigned to tables successfully
 *       400:
 *         description: Validation error
 */
router.post(
	"/assignWaiterToTables",
	[
		check("user_id")
			.not()
			.isEmpty()
			.withMessage("User ID is required")
			.isNumeric()
			.withMessage("User ID must be a number"),
		check("table_ids")
			.not()
			.isEmpty()
			.withMessage("Table IDs are required")
			.matches(/^\d+(,\d+)*$/)
			.withMessage("Table IDs must be comma-separated numbers"),
	],
	validation,
	authMiddleware,
	admin.assignWaiterToTables
);

/**
 * @swagger
 * /editAssignWaiterToTable:
 *   put:
 *     summary: Edit waiter assignment to a table
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               table_ids:
 *                 type: string
 *     responses:
 *       200:
 *         description: Waiter assignment updated successfully
 *       400:
 *         description: Validation error
 */

router.put(
	"/editAssignWaiterToTable",
	[
		check("table_ids")
			.not()
			.isEmpty()
			.withMessage("Table IDs are required")
			.custom((value) => {
				const tableIds = value.split(",").map((id) => id.trim());
				const invalidIds = tableIds.some(
					(id) => isNaN(id) || parseInt(id) <= 0
				);
				if (invalidIds) {
					throw new Error("Invalid table ID format");
				}
				return true;
			})
			.withMessage("Invalid table ID format"),
	],
	validation,
	authMiddleware,
	admin.editAssignWaiterToTable
);

/**
 * @swagger
 * /waitersTableList:
 *   get:
 *     summary: Get a list of tables assigned to a waiter
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: waiterId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the waiter to retrieve tables for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: true
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of tables assigned to the waiter
 *       400:
 *         description: Validation error
 *       404:
 *         description: Waiter not found
 *       500:
 *         description: Internal server error
 *       default:
 *         description: Unexpected error
 */
router.get(
	"/waitersTableList",
	[
		check("waiterId")
			.not()
			.isEmpty()
			.withMessage("Waiter ID is required")
			.isNumeric()
			.withMessage("Waiter ID must be a numeric value")
			.toInt(), // Convert to integer
		check("page").notEmpty().withMessage("page is required"),
	],
	validation,
	authMiddleware,
	admin.waitersTableList
);

//------------------------------------------------Profile Routes------------------------------------------------//

/**
 * @swagger
 * /getProfileDetails:
 *   get:
 *     summary: Get profile details
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Profile details retrieved successfully
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
router.get("/getProfileDetails", authMiddleware, admin.getProfileDetails);

//------------------------------------------------Bussiness Profile Routes------------------------------------------------//
/**
 * @swagger
 * /getBusinessProfile:
 *   get:
 *     summary: Get business profile details
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Business profile details retrieved successfully
 *       404:
 *         description: Business profile not found
 *       500:
 *         description: Internal server error
 */

router.get("/getBusinessProfile", authMiddleware, admin.getBusinessProfile);

/**
 * @swagger
 * /businessHours:
 *   post:
 *     summary: Set business hours
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *               opening_hours:
 *                 type: string
 *               closing_hours:
 *                 type: string
 *               day_status:
 *                 type: boolean
 *               value:
 *                 type: string
 *                 enum: [is_all, is_create, is_edit, is_get, is_delete]
 *     responses:
 *       200:
 *         description: Business hours set
 *       400:
 *         description: Validation error
 */
router.post(
	"/businessHours",
	[
		check("day").not().isEmpty().withMessage("Day is required").trim().escape(),
		check("opening_hours")
			.not()
			.isEmpty()
			.withMessage("Opening hours are required")
			.trim()
			.escape(),
		check("closing_hours")
			.not()
			.isEmpty()
			.withMessage("Closing hours are required")
			.trim()
			.escape(),
		check("day_status")
			.isBoolean()
			.withMessage("Day status must be a boolean value")
			.trim()
			.escape(),
		check("value")
			.isIn(["is_all", "is_create", "is_edit", "is_get", "is_delete"])
			.withMessage("Invalid value for 'value' parameter")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	admin.businessHours
);

/**
 *  @swagger
 * /businessHours/{business_hours_id}/status:
 *   put:
 *     summary: Toggle the status of business hours for a specific day
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: business_hours_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the business hours entry to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day_status:
 *                 type: boolean
 *                 description: Status of the day (open/closed)
 *     responses:
 *       200:
 *         description: Business hours status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Business hours entry not found
 *       500:
 *         description: Internal server error
 */
router.put(
	"/businessHours/:business_hours_id/status",
	[
		check("day_status")
			.not()
			.isEmpty()
			.withMessage("Day status is required")
			.isBoolean()
			.withMessage("Day status must be a boolean value"),
	],
	validation,
	authMiddleware,
	admin.toggleBusinessHoursStatus
);

//------------------------------------------------Filter Routes------------------------------------------------//

/**
 * @swagger
 * /filter:
 *   get:
 *     summary: Filter orders
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: order_status
 *         schema:
 *           type: string
 *         required: false
 *         description: Status of the order
 *       - in: query
 *         name: order_type
 *         schema:
 *           type: string
 *         required: false
 *         description: Type of the order
 *       - in: query
 *         name: bill_status
 *         schema:
 *           type: string
 *         required: false
 *         description: Bill status
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *         required: false
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         required: false
 *         description: Sort order
 *       - in: query
 *         name: field
 *         schema:
 *           type: string
 *         required: false
 *         description: Field to filter
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Start date for filtering
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: End date for filtering
 *       - in: query
 *         name: select_date
 *         schema:
 *           type: string
 *         required: false
 *         description: Specific date selection
 *     responses:
 *       200:
 *         description: Order list fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 current_page:
 *                   type: integer
 *                 total_pages:
 *                   type: integer
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total_orders:
 *                   type: integer
 *                 total_amount:
 *                   type: number
 *       400:
 *         description: Validation error
 *       404:
 *         description: Orders not found
 *       500:
 *         description: Internal server error
 */
router.get(
	"/filter",
	[
		check("page")
			.optional()
			.isInt({ min: 1 })
			.withMessage("Page must be a positive integer"),
		check("order_status").optional().trim().escape(),
		check("order_type").optional().trim().escape(),
		check("bill_status").optional().trim().escape(),
		check("sort_by").optional().trim().escape(),
		check("sort_order")
			.optional()
			.isIn(["asc", "desc"])
			.withMessage("Sort order must be 'asc' or 'desc'"),
		check("field").optional().trim().escape(),
		check("start_date")
			.optional()
			.isISO8601()
			.withMessage("Start date must be a valid date"),
		check("end_date")
			.optional()
			.isISO8601()
			.withMessage("End date must be a valid date"),
		check("select_date").optional().trim().escape(),
	],
	validation,
	authMiddleware,
	admin.filter
);

//------------------------------------------------Toggle Item Status Routes------------------------------------------------//
/**
 * @swagger
 * /disable/item/status:
 *   put:
 *     summary: Disable item or enable item
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item_id:
 *                 type: integer
 *                 description: ID of the item to toggle
 *               is_disabled:
 *                 type: boolean
 *                 description: Set to true to disable item, false to enable
 *             required:
 *               - item_id
 *               - is_disabled
 *     responses:
 *       200:
 *         description: Item status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: "Item disabled successfully"
 *                 item:
 *                   type: object
 *                   properties:
 *                     item_id:
 *                       type: integer
 *                     item_name:
 *                       type: string
 *                     is_disabled:
 *                       type: boolean
 *       400:
 *         description: Cannot disable item due to active orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: "Cannot disable item. There are active orders for this item in the past 24 hours."
 *                 activeOrders:
 *                   type: integer
 *       403:
 *         description: Access denied
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.put(
	"/disable/item/status",
	[
		check("item_id")
			.not()
			.isEmpty()
			.withMessage("Item ID is required")
			.isInt({ min: 1 })
			.withMessage("Item ID must be a positive integer"),
		check("is_disabled")
			.not()
			.isEmpty()
			.withMessage("is_disabled field is required")
			.isBoolean()
			.withMessage("is_disabled must be a boolean value"),
	],
	validation,
	authMiddleware,
	admin.disableItemStatus
);

//------------------------------------------------Contact Us Routes------------------------------------------------//
// TODO: Contact us route is commented as per the current requirement
// /**
//  * @swagger
//  * /contactUs:
//  *   post:
//  *     summary: Contact support
//  *     tags: [Admin]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               subjects:
//  *                 type: string
//  *               message:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Message sent successfully
//  *       400:
//  *         description: Validation error
//  *       500:
//  *         description: Internal server error
//  */
// router.post(
// 	"/contactUs",
// 	[
// 		check("subjects")
// 			.not()
// 			.isEmpty()
// 			.withMessage("Subject is required")
// 			.trim()
// 			.escape(),
// 		check("message")
// 			.not()
// 			.isEmpty()
// 			.withMessage("Message is required")
// 			.trim()
// 			.escape(),
// 	],
// 	validation,
// 	authMiddleware,
// 	admin.contactUs
// );

//------------------------------------------------Order Routes------------------------------------------------//
// TODO: Order routes are commented as per the current requirement
// /**
//  * @swagger
//  * /orderDetails:
//  *   get:
//  *     summary: Get order details
//  *     tags: [Admin]
//  *     parameters:
//  *       - in: query
//  *         name: order_id
//  *         schema:
//  *           type: integer
//  *         required: true
//  *         description: ID of the order to retrieve details for
//  *     responses:
//  *       200:
//  *         description: Order details retrieved successfully
//  *       404:
//  *         description: Order not found
//  *       500:
//  *         description: Internal server error
//  */
// router.get(
// 	"/orderDetails",
// 	[
// 		check("order_id")
// 			.not()
// 			.isEmpty()
// 			.withMessage("Order ID is required")
// 			.isNumeric()
// 			.withMessage("Order ID not valid")
// 			.trim()
// 			.escape(),
// 	],
// 	validation,
// 	authMiddleware,
// 	admin.orderDetails
// );

// /**
//  * @swagger
//  * /orderHistory:
//  *   get:
//  *     summary: Get order history
//  *     tags: [Admin]
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *         required: true
//  *         description: Page number for pagination
//  *     responses:
//  *       200:
//  *         description: Order history retrieved successfully
//  *       404:
//  *         description: No orders found
//  *       500:
//  *         description: Internal server error
//  */
// router.get(
// 	"/orderHistory",
// 	[
// 		check("page")
// 			.not()
// 			.isEmpty()
// 			.withMessage("page is required")
// 			.trim()
// 			.escape(),
// 	],
// 	validation,
// 	authMiddleware,
// 	admin.orderHistory
// );

// ------------------------------------------------Promo Code Routes------------------------------------------------//
//TODO: Promocode routes are commented as per the current requirement
// /**
//  * @swagger
//  * /addPromoCode:
//  *   post:
//  *     summary: Add a new promo code
//  *     tags: [Admin]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               code:
//  *                 type: string
//  *               name:
//  *                 type: string
//  *               description:
//  *                 type: string
//  *               discount:
//  *                 type: number
//  *               expiresAt:
//  *                 type: string
//  *                 format: date
//  *     responses:
//  *       201:
//  *         description: Promo code created successfully
//  *       400:
//  *         description: Validation error
//  *       500:
//  *         description: Internal server error
//  */
// router.post(
// 	"/addPromoCode",
// 	// [
// 	//   check("code")
// 	//     .not()
// 	//     .isEmpty()
// 	//     .withMessage("code is required")
// 	//     .trim()
// 	//     .escape(),
// 	//   check("name")
// 	//     .not()
// 	//     .isEmpty()
// 	//     .withMessage("name is required")
// 	//     .trim()
// 	//     .escape(),
// 	//   check("description")
// 	//     .not()
// 	//     .isEmpty()
// 	//     .withMessage("description is required")
// 	//     .trim()
// 	//     .escape(),
// 	//   check("discount")
// 	//     .not()
// 	//     .isEmpty()
// 	//     .withMessage("discount is required")
// 	//     .trim()
// 	//     .escape(),
// 	//   check("expiresAt")
// 	//     .not()
// 	//     .isEmpty()
// 	//     .withMessage("expiresAt is required")
// 	//     .trim()
// 	//     .escape(),
// 	// ],
// 	// validation,
// 	authMiddleware,
// 	admin.addPromoCode
// );

// /**
//  * @swagger
//  * /getPromoCodes:
//  *   get:
//  *     summary: Get a list of promo codes
//  *     tags: [Admin]
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *         required: true
//  *         description: Page number for pagination
//  *     responses:
//  *       200:
//  *         description: Promo codes retrieved successfully
//  *       404:
//  *         description: No promo codes found
//  *       500:
//  *         description: Internal server error
//  */
// router.get(
// 	"/getPromoCodes",
// 	[
// 		check("page")
// 			.not()
// 			.isEmpty()
// 			.withMessage("page is required")
// 			.trim()
// 			.escape(),
// 	],
// 	validation,
// 	authMiddleware,
// 	admin.getPromoCodes
// );

// /**
//  * @swagger
//  * /deletePromoCode:
//  *   delete:
//  *     summary: Delete a promo code
//  *     tags: [Admin]
//  *     parameters:
//  *       - in: query
//  *         name: promoCode_id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: ID of the promo code to delete
//  *     responses:
//  *       200:
//  *         description: Promo code deleted successfully
//  *       404:
//  *         description: Promo code not found
//  *       500:
//  *         description: Internal server error
//  */
// router.delete(
// 	"/deletePromoCode",
// 	[
// 		check("promoCode_id")
// 			.not()
// 			.isEmpty()
// 			.withMessage("promoCode_id is required")
// 			.trim()
// 			.escape(),
// 	],
// 	validation,
// 	authMiddleware,
// 	admin.deletePromoCode
// );

// ------------------------------------------------Notification Routes------------------------------------------------//
//TODO: Notification routes are commented as per the current requirement

// /**
//  * @swagger
//  * /notificationList:
//  *   get:
//  *     summary: Get a list of notifications
//  *     tags: [Admin]
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *         required: true
//  *         description: Page number for pagination
//  *     responses:
//  *       200:
//  *         description: Notifications retrieved successfully
//  *       404:
//  *         description: No notifications found
//  *       500:
//  *         description: Internal server error
//  */
// router.get(
// 	"/notificationList",
// 	[
// 		check("page")
// 			.notEmpty()
// 			.withMessage("page is required")
// 			.isInt({ min: 1 })
// 			.withMessage("page input not valid"),
// 	],
// 	validation,
// 	authMiddleware,
// 	admin.notificationList
// );

console.log("im out of admin.js router");
module.exports = router;

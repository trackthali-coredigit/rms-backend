const express = require("express");
const router = express.Router();
const multer = require("multer");
const business_image = multer({ dest: "uploads/business_image" });
const { check, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth_middleware");
console.log("im in superAdmin router");

const superAdmin = require("../controllers/super.admin");
let validation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};

/**
 * @swagger
 * /superAdminSignIn:
 *   post:
 *     summary: Super admin sign in
 *     tags: [SuperAdmin]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               device_id:
 *                 type: string
 *               device_type:
 *                 type: string
 *               device_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       400:
 *         description: Validation error
 */
router.post(
	"/superAdminSignIn",
	[
		check("email")
			.not()
			.isEmpty()
			.withMessage("email is required")
			.trim()
			.escape(),
		check("password")
			.not()
			.isEmpty()
			.withMessage("password is required")
			.trim()
			.escape(),
		check("device_id")
			.not()
			.isEmpty()
			.withMessage("device_id is required")
			.trim()
			.escape(),
		check("device_type")
			.not()
			.isEmpty()
			.withMessage("device_type is required")
			.trim()
			.escape(),
		check("device_token")
			.not()
			.isEmpty()
			.withMessage("device_token is required")
			.trim()
			.escape(),
	],
	validation,
	superAdmin.SuperAdminSignIn
);

/**
 * @swagger
 * /create_admin:
 *   post:
 *     summary: Create a new admin
 *     tags: [SuperAdmin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               business_image:
 *                 type: string
 *                 format: binary
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               username:
 *                 type: string
 *               phone_no:
 *                 type: string
 *               iso_code:
 *                 type: string
 *               country_code:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               business_name:
 *                 type: string
 *               business_email:
 *                 type: string
 *               business_phone_no:
 *                 type: string
 *               business_iso_code:
 *                 type: string
 *               business_country_code:
 *                 type: string
 *               tax:
 *                 type: number
 *                 format: float
 *               description: Tax percentage (0-100)
 *     responses:
 *       200:
 *         description: Admin created
 *       400:
 *         description: Validation error
 */
router.post(
	"/create_admin",
	business_image.fields([{ name: "business_image" }]),
	[
		check("business_image").custom((value, { req }) => {
			if (!req.files || !req.files.business_image) {
				throw new Error("business_image is required");
			}
			if (req.files.business_image.length > 1) {
				req.files.item_image.forEach((element) => {
					fs.unlinkSync(element.path);
				});
				throw new Error("Maximum 1 images allowed");
			}
			return true;
		}),
		check("first_name")
			.not()
			.isEmpty()
			.withMessage("first_name is required")
			.trim()
			.escape(),
		check("last_name")
			.not()
			.isEmpty()
			.withMessage("last_name is required")
			.trim()
			.escape(),
		check("username")
			.not()
			.isEmpty()
			.withMessage("username is required")
			.trim()
			.escape(),
		check("phone_no")
			.not()
			.isEmpty()
			.withMessage("Phone Number is required")
			.isMobilePhone()
			.withMessage("Valid Phone Number is required")
			.trim()
			.escape(),
		check("iso_code")
			.not()
			.isEmpty()
			.withMessage("ISO Code is required")
			.isLength({ min: 2, max: 3 })
			.withMessage("ISO Code must be 2 or 3 characters long")
			.trim()
			.escape(),
		check("country_code")
			.not()
			.isEmpty()
			.withMessage("Country Code is required")
			.isLength({ min: 1, max: 4 })
			.withMessage("Country Code must be between 1 and 4 characters long")
			.trim()
			.escape(),
		check("email")
			.not()
			.isEmpty()
			.withMessage("Email is required")
			.isEmail()
			.withMessage("Invalid email format")
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

		check("business_name")
			.not()
			.isEmpty()
			.withMessage("business_name is required")
			.trim()
			.escape(),
		check("business_email")
			.not()
			.isEmpty()
			.withMessage("business_email is required")
			.isEmail()
			.withMessage("Invalid business_email format")
			.trim()
			.escape(),
		check("business_phone_no")
			.not()
			.isEmpty()
			.withMessage("business_phone_no  is required")
			.isMobilePhone()
			.withMessage("Valid business_phone_no is required")
			.trim()
			.escape(),
		check("business_iso_code")
			.not()
			.isEmpty()
			.withMessage("business_iso_code is required")
			.isLength({ min: 2, max: 3 })
			.withMessage("business_iso_code must be 2 or 3 characters long")
			.trim()
			.escape(),
		check("business_country_code")
			.not()
			.isEmpty()
			.withMessage("business_country_code is required")
			.isLength({ min: 1, max: 4 })
			.withMessage(
				"business_country_code must be between 1 and 4 characters long"
			)
			.trim()
			.escape(),
		check("tax")
			.not()
			.isEmpty()
			.withMessage("Tax is required")
			.isFloat({ min: 0, max: 100 })
			.withMessage("Tax must be a positive number between 0 and 100")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	superAdmin.createAdmin
);
/**
 * @swagger
 * /edit_admin:
 *   put:
 *     summary: Edit an admin
 *     tags: [SuperAdmin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               business_image:
 *                 type: string
 *                 format: binary
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               username:
 *                 type: string
 *               phone_no:
 *                 type: string
 *               iso_code:
 *                 type: string
 *               country_code:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               business_name:
 *                 type: string
 *               business_email:
 *                 type: string
 *               business_phone_no:
 *                 type: string
 *               business_iso_code:
 *                 type: string
 *               business_country_code:
 *                 type: string
 *               admin_id:
 *                 type: integer
 *               tax:
 *                 type: number
 *                 format: float
 *               description: Tax percentage (0-100)
 *     responses:
 *       200:
 *         description: Admin edited
 *       400:
 *         description: Validation error
 */
router.put(
	"/edit_admin",
	business_image.fields([{ name: "business_image" }]),
	[
		check("business_image").custom((value, { req }) => {
			if (
				req.files &&
				req.files.business_image &&
				req.files.business_image.length > 1
			) {
				req.files.item_image.forEach((element) => {
					fs.unlinkSync(element.path);
				});
				throw new Error("Maximum 1 images allowed");
			}
			return true;
		}),
		check("first_name").optional().trim().escape(),
		check("last_name").optional().trim().escape(),
		check("username").optional().trim().escape(),
		check("phone_no")
			.optional()
			.isMobilePhone()
			.withMessage("Valid Phone Number is required")
			.trim()
			.escape(),
		check("iso_code")
			.optional()
			.isLength({ min: 2, max: 3 })
			.withMessage("ISO Code must be 2 or 3 characters long")
			.trim()
			.escape(),
		check("country_code")
			.optional()
			.isLength({ min: 1, max: 4 })
			.withMessage("Country Code must be between 1 and 4 characters long")
			.trim()
			.escape(),
		check("email")
			.optional()
			.isEmail()
			.withMessage("Invalid email format")
			.trim()
			.escape(),
		check("password")
			.optional()
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters long")
			.trim()
			.escape(),

		check("business_name").optional().trim().escape(),
		check("business_email")
			.optional()
			.isEmail()
			.withMessage("Invalid business_email format")
			.trim()
			.escape(),
		check("business_phone_no")
			.optional()
			.isMobilePhone()
			.withMessage("Valid business_phone_no is required")
			.trim()
			.escape(),
		check("business_iso_code")
			.optional()
			.isLength({ min: 2, max: 3 })
			.withMessage("business_iso_code must be 2 or 3 characters long")
			.trim()
			.escape(),
		check("business_country_code")
			.optional()
			.isLength({ min: 1, max: 4 })
			.withMessage(
				"business_country_code must be between 1 and 4 characters long"
			)
			.trim()
			.escape(),
		check("admin_id")
			.not()
			.isEmpty()
			.withMessage("admin_id is required")
			.isInt({ min: 1 })
			.withMessage("admin_id must be a positive integer")
			.trim()
			.escape(),
		check("tax")
			.optional()
			.isFloat({ min: 0, max: 100 })
			.withMessage("Tax must be a positive number between 0 and 100")
			.trim()
			.escape(),
		check("admin_id")
			.optional()
			.isInt()
			.withMessage("admin_id must be an integer")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	superAdmin.editAdmin
);
/**
 * @swagger
 * /getBussinessAdminList:
 *   get:
 *     summary: Get business admin list
 *     tags: [SuperAdmin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: true
 *         description: Page number
 *     responses:
 *       200:
 *         description: Business admin list
 *       400:
 *         description: Validation error
 */
router.get(
	"/getBussinessAdminList",
	[
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.isInt({ min: 1 })
			.withMessage("Page must be a positive integer")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	superAdmin.getBusinessAdminList
);
/**
 * @swagger
 * /getAdminStaffList:
 *   get:
 *     summary: Get staff list
 *     tags: [SuperAdmin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: true
 *         description: Page number
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Business ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         required: true
 *         description: Role (waiter, barista, supervisor)
 *     responses:
 *       200:
 *         description: Staff list
 *       400:
 *         description: Validation error
 */
router.get(
	"/getAdminStaffList",
	[
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.isInt({ min: 1 })
			.withMessage("Page must be a positive integer")
			.trim()
			.escape(),
		check("business_id")
			.not()
			.isEmpty()
			.withMessage("business_id is required")
			.isInt({ min: 1 })
			.withMessage("business_id must be a positive integer")
			.trim()
			.escape(),
		check("role")
			.not()
			.isEmpty()
			.withMessage("Role is required")
			.trim()
			.escape()
			.isIn(["waiter", "barista", "supervisor"])
			.withMessage("Invalid role, must be one of: waiter, barista, supervisor"),
	],
	validation,
	authMiddleware,
	superAdmin.getStaffList
);

/**
 * @swagger
 * /getBussinessList:
 *   get:
 *     summary: Get business list
 *     tags: [SuperAdmin]
 *     responses:
 *       200:
 *         description: Business list
 *       400:
 *         description: Validation error
 */
router.get(
	"/getBussinessList",
	// [
	//     check("page").not().isEmpty().withMessage("page is required")
	//         .isInt({ min: 1 }).withMessage("Page must be a positive integer").trim().escape(),
	// ],
	// validation,
	authMiddleware,
	superAdmin.getBusinessList
);
/**
 * @swagger
 * /getBussinessTableList:
 *   get:
 *     summary: Get business table list
 *     tags: [SuperAdmin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: true
 *         description: Page number
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business table list
 *       400:
 *         description: Validation error
 */
router.get(
	"/getBussinessTableList",
	[
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.isInt({ min: 1 })
			.withMessage("Page must be a positive integer")
			.trim()
			.escape(),
		check("business_id")
			.not()
			.isEmpty()
			.withMessage("business_id is required")
			.isInt({ min: 1 })
			.withMessage("business_id must be a positive integer")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	superAdmin.getBusinessTableList
);

/**
 * @swagger
 * /getBussinessCategoryList:
 *   get:
 *     summary: Get business category list
 *     tags: [SuperAdmin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: true
 *         description: Page number
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business category list
 *       400:
 *         description: Validation error
 */
router.get(
	"/getBussinessCategoryList",
	[
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.isInt({ min: 1 })
			.withMessage("Page must be a positive integer")
			.trim()
			.escape(),
		check("business_id")
			.not()
			.isEmpty()
			.withMessage("business_id is required")
			.isInt({ min: 1 })
			.withMessage("business_id must be a positive integer")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	superAdmin.getBusinessCategoryList
);
/**
 * @swagger
 * /getBussinessItemList:
 *   get:
 *     summary: Get business item list
 *     tags: [SuperAdmin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: true
 *         description: Page number
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Business item list
 *       400:
 *         description: Validation error
 */
router.get(
	"/getBussinessItemList",
	[
		check("page")
			.not()
			.isEmpty()
			.withMessage("page is required")
			.isInt({ min: 1 })
			.withMessage("Page must be a positive integer")
			.trim()
			.escape(),
		check("category_id")
			.not()
			.isEmpty()
			.withMessage("category_id is required")
			.isInt({ min: 1 })
			.withMessage("category_id must be a positive integer")
			.trim()
			.escape(),
	],
	validation,
	authMiddleware,
	superAdmin.getBusinessItemList
);

console.log("im out of superAdmin router");
module.exports = router;

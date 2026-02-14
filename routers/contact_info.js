const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth_middleware");

console.log("in contact info router");

const validation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}
	next();
};

const contactInfo = require("../controllers/contact_info");

/**
 * @swagger
 * /add-contact-info:
 *   post:
 *     summary: Submit contact information
 *     tags: [Contact Info]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contact info submitted successfully
 *       422:
 *         description: Validation error
 */
router.post(
	"/add-contact-info",
	authMiddleware,
	[
		check("subject")
			.notEmpty()
			.withMessage("subject is required")
			.isString()
			.withMessage("subject must be a string"),
		check("message")
			.notEmpty()
			.withMessage("message is required")
			.isString()
			.withMessage("message must be a string"),
	],
	validation,
	contactInfo.AddContactInfo
);

/**
 * @swagger
 * /contact-info/all:
 *   get:
 *     summary: Get all contact information with pagination (Admin only)
 *     tags: [Contact Info]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *         description: Field to sort by (default createdAt)
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC, asc, desc]
 *         description: Sort order (default DESC)
 *     responses:
 *       200:
 *         description: Contact info fetched successfully
 *       401:
 *         description: Unauthorized - Admin only
 */
router.get(
	"/contact-info/all",
	authMiddleware,
	[
		check("page")
			.optional()
			.isInt()
			.withMessage("page must be an integer"),
		check("sort_by")
			.optional()
			.isString()
			.withMessage("sort_by must be a string"),
		check("sort_order")
			.optional()
			.isIn(["ASC", "DESC", "asc", "desc"])
			.withMessage("sort_order must be ASC or DESC"),
	],
	validation,
	contactInfo.GetAllContactInfo
);

module.exports = router;

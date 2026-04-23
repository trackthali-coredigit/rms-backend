const express = require("express");
const router = express.Router();
const appPolicyController = require("../controllers/app_policy");

/**
 * @swagger
 * /terms-and-conditions:
 *   get:
 *     summary: Get Terms and Conditions HTML content
 *     tags: [AppPolicy]
 *     responses:
 *       200:
 *         description: Terms and Conditions fetched successfully
 *       500:
 *         description: Internal Server Error
 */
router.get("/terms-and-conditions", appPolicyController.GetTermsAndConditions);

/**
 * @swagger
 * /privacy-policy:
 *   get:
 *     summary: Get Privacy Policy HTML content
 *     tags: [AppPolicy]
 *     responses:
 *       200:
 *         description: Privacy Policy fetched successfully
 *       500:
 *         description: Internal Server Error
 */
router.get("/privacy-policy", appPolicyController.GetPrivacyPolicy);

module.exports = router;

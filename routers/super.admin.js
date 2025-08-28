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

router.post("/superAdminSignIn",
    [
        check("email").not().isEmpty().withMessage("email is required").trim().escape(),
        check("password").not().isEmpty().withMessage("password is required").trim().escape(),
        check("device_id").not().isEmpty().withMessage("device_id is required").trim().escape(),
        check("device_type").not().isEmpty().withMessage("device_type is required").trim().escape(),
        check("device_token").not().isEmpty().withMessage("device_token is required").trim().escape(),
    ],
    validation, superAdmin.SuperAdminSignIn
);

router.post("/create_admin",
    business_image.fields([{ name: "business_image" }]),
    [
        check("business_image").custom((value, { req }) => {
            if (!req.files || !req.files.business_image) {
                throw new Error('business_image is required');
            }
            if (req.files.business_image.length > 1) {
                req.files.item_image.forEach(element => {
                    fs.unlinkSync(element.path);
                });
                throw new Error('Maximum 1 images allowed');
            }
            return true;
        }),
        check("first_name").not().isEmpty().withMessage("first_name is required").trim().escape(),
        check("last_name").not().isEmpty().withMessage("last_name is required").trim().escape(),
        check("username").not().isEmpty().withMessage("username is required").trim().escape(),
        check('phone_no').not().isEmpty().withMessage("Phone Number is required")
            .isMobilePhone().withMessage('Valid Phone Number is required').trim().escape(),
        check('iso_code').not().isEmpty().withMessage("ISO Code is required")
            .isLength({ min: 2, max: 3 }).withMessage('ISO Code must be 2 or 3 characters long').trim().escape(),
        check('country_code').not().isEmpty().withMessage("Country Code is required")
            .isLength({ min: 1, max: 4 }).withMessage('Country Code must be between 1 and 4 characters long').trim().escape(),
        check("email").not().isEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format").trim().escape(),
        check("password").not().isEmpty().withMessage("Password is required").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long").trim().escape(),


        check("business_name").not().isEmpty().withMessage("business_name is required").trim().escape(),
        check("business_email").not().isEmpty().withMessage("business_email is required").isEmail().withMessage("Invalid business_email format").trim().escape(),
        check('business_phone_no').not().isEmpty().withMessage("business_phone_no  is required")
            .isMobilePhone().withMessage('Valid business_phone_no is required').trim().escape(),
        check('business_iso_code').not().isEmpty().withMessage("business_iso_code is required")
            .isLength({ min: 2, max: 3 }).withMessage('business_iso_code must be 2 or 3 characters long').trim().escape(),
        check('business_country_code').not().isEmpty().withMessage("business_country_code is required")
            .isLength({ min: 1, max: 4 }).withMessage('business_country_code must be between 1 and 4 characters long').trim().escape(),

    ],
    validation, authMiddleware,superAdmin.createAdmin
);
router.put("/edit_admin",
    business_image.fields([{ name: "business_image" }]),
    [
        check("business_image").custom((value, { req }) => {
            if (req.files && req.files.business_image && req.files.business_image.length > 1) {
                req.files.item_image.forEach(element => {
                    fs.unlinkSync(element.path);
                });
                throw new Error('Maximum 1 images allowed');
            }
            return true;
        }),
        check("first_name").optional().trim().escape(),
        check("last_name").optional().trim().escape(),
        check("username").optional().trim().escape(),
        check('phone_no').optional()
            .isMobilePhone().withMessage('Valid Phone Number is required').trim().escape(),
        check('iso_code').optional()
            .isLength({ min: 2, max: 3 }).withMessage('ISO Code must be 2 or 3 characters long').trim().escape(),
        check('country_code').optional()
            .isLength({ min: 1, max: 4 }).withMessage('Country Code must be between 1 and 4 characters long').trim().escape(),
        check("email").optional().isEmail().withMessage("Invalid email format").trim().escape(),
        check("password").optional().isLength({ min: 8 }).withMessage("Password must be at least 8 characters long").trim().escape(),


        check("business_name").optional().trim().escape(),
        check("business_email").optional().isEmail().withMessage("Invalid business_email format").trim().escape(),
        check('business_phone_no').optional()
            .isMobilePhone().withMessage('Valid business_phone_no is required').trim().escape(),
        check('business_iso_code').optional()
            .isLength({ min: 2, max: 3 }).withMessage('business_iso_code must be 2 or 3 characters long').trim().escape(),
        check('business_country_code').optional()
            .isLength({ min: 1, max: 4 }).withMessage('business_country_code must be between 1 and 4 characters long').trim().escape(),
        check('admin_id').not().isEmpty().withMessage("admin_id is required")
            .isInt({ min: 1 }).withMessage("admin_id must be a positive integer").trim().escape(),

    ],
    validation, authMiddleware,superAdmin.editAdmin
);
router.get("/getBussinessAdminList",
    [
        check("page").not().isEmpty().withMessage("page is required")
            .isInt({ min: 1 }).withMessage("Page must be a positive integer").trim().escape(),
    ],
    validation,
    authMiddleware,superAdmin.getBusinessAdminList
);
router.get("/getStaffList",
    [
        check("page").not().isEmpty().withMessage("page is required")
            .isInt({ min: 1 }).withMessage("Page must be a positive integer").trim().escape(),
        check("business_id").not().isEmpty().withMessage("business_id is required")
            .isInt({ min: 1 }).withMessage("business_id must be a positive integer").trim().escape(),
        check("role").not().isEmpty().withMessage("Role is required").trim().escape()
            .isIn(["waiter", "barista", "supervisor"]).withMessage("Invalid role, must be one of: waiter, barista, supervisor"),
        ],
    validation,authMiddleware,superAdmin.getStaffList
);

router.get("/getBussinessList",
    // [
    //     check("page").not().isEmpty().withMessage("page is required")
    //         .isInt({ min: 1 }).withMessage("Page must be a positive integer").trim().escape(),
    // ],
    // validation,
    authMiddleware,superAdmin.getBusinessList
);
router.get("/getBussinessTableList",
    [
        check("page").not().isEmpty().withMessage("page is required")
            .isInt({ min: 1 }).withMessage("Page must be a positive integer").trim().escape(),
        check("business_id").not().isEmpty().withMessage("business_id is required")
            .isInt({ min: 1 }).withMessage("business_id must be a positive integer").trim().escape(),
    ],
    validation, authMiddleware, superAdmin.getBusinessTableList
);

router.get("/getBussinessCategoryList",
    [
        check("page").not().isEmpty().withMessage("page is required")
            .isInt({ min: 1 }).withMessage("Page must be a positive integer").trim().escape(),
        check("business_id").not().isEmpty().withMessage("business_id is required")
            .isInt({ min: 1 }).withMessage("business_id must be a positive integer").trim().escape(),
    ],
    validation, authMiddleware, superAdmin.getBusinessCategoryList
);
router.get("/getBussinessItemList",
    [
        check("page").not().isEmpty().withMessage("page is required")
            .isInt({ min: 1 }).withMessage("Page must be a positive integer").trim().escape(),
        check("category_id").not().isEmpty().withMessage("category_id is required")
            .isInt({ min: 1 }).withMessage("category_id must be a positive integer").trim().escape(),
    ],
    validation, authMiddleware, superAdmin.getBusinessItemList
);

console.log("im out of superAdmin router");
module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/item_image" });
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


router.post("/signin",[
    check("emailOrUsername").not().isEmpty().withMessage("Email or username is required").trim().escape(),
    check("password").not().isEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .trim().escape(),
    check("device_id").not().isEmpty().withMessage("Device ID is required").trim().escape(),
    check("device_type").not().isEmpty().withMessage("Device type is required").trim().escape(),
    check("device_token").not().isEmpty().withMessage("Device token is required").trim().escape(),
    check("role").not().isEmpty().withMessage("Role is required").trim().escape(),],
    validation,
admin.signin
);
router.post("/otp_verify",[
    check("emailOrUsername").not().isEmpty().withMessage("Email or username is required").trim().escape(),
    check("otp").not().isEmpty().withMessage("OTP is required").trim().escape(),
    check("role").not().isEmpty().withMessage("Role is required").trim().escape(),],
    validation,
  admin.otp_verify
);
router.post("/forgetPassword",
  [
    check("emailOrUsername").not().isEmpty().withMessage("Email or username is required").trim().escape(),
  ],
  validation,
  admin.forgetPassword
);
router.put("/StaffForgetPassword",
  [
    check("user_id").not().isEmpty().withMessage("user_id is required").trim().escape(),
    check("password").not().isEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
      .trim().escape(),
  ],
  validation,
  authMiddleware,
  admin.StaffForgetPassword
);
router.post("/resetPassword",
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
router.put("/changePassword",
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
  ],validation,
  authMiddleware,
  admin.changePassword
);
router.post("/signOut",
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

router.post("/businessHours",
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
      .isIn(["is_all", "is_create", "is_edit", "is_get"])
      .withMessage("Invalid value for 'value' parameter")
      .trim()
      .escape(),
  ],
  validation,
  authMiddleware,
  admin.businessHours
);

router.post("/addCategory",
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
router.delete("/deleteCategory",
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

router.post("/addItem",
  upload.fields([{ name: "item_image" }]),
  // [
  //   check("item_image").custom((value, { req }) => {
  //     if (!req.files || !req.files.item_image) {
  //       throw new Error('Image is required');
  //     }
  //     if (req.files.item_image.length>10){
  //       req.files.item_image.forEach(element => {
  //         fs.unlinkSync(element.path);
  //       });
  //       throw new Error('Maximum 10 images allowed');
  //     }
  //     return true;
  //   }),
  //   check("item_name")
  //     .not()
  //     .isEmpty()
  //     .withMessage("Item name is required")
  //     .trim()
  //     .escape(),
  //   check('price')
  //     .notEmpty().withMessage('Price is required')
  //     .isFloat({ min: 0, max: 1000000 }).withMessage('Price must be a non-negative number less than or equal to 1000000'),
  //   check('stock')
  //     .notEmpty().withMessage('Stock is required')
  //     .isInt({ min: 0, max: 1000000 }).withMessage('Stock must be a non-negative integer less than or equal to 1000000'),
  //   check("ingredients")
  //     .not()
  //     .isEmpty()
  //     .withMessage("Ingredients are required")
  //     .trim()
  //     .escape(),
  //   check("category_id")
  //     .not()
  //     .isEmpty()
  //     .withMessage("Category ID is required")
  //     .trim()
  //     .escape()
  //     .isNumeric()
  //     .withMessage("Category ID must be a number")
  // ],
  validation,
  authMiddleware,
  admin.addItem
);
router.put("/editItem",
  upload.fields([{ name: "item_image", maxCount: 10 }]),
  
  authMiddleware,
  admin.editItem
);
router.delete("/deleteItemImage",
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
  admin.deleteItemImage
);
router.delete("/deleteIngredient",
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
router.delete( "/deleteItem",
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
router.get("/getCategoryList",
[check("page").notEmpty().withMessage("page is required")],
validation, admin.getCategoryList
);

router.get("/getItemList",
  [
    check("category_id")
      .not()
      .isEmpty()
      .withMessage("Category ID is required")
      .trim()
      .escape()
      .isNumeric()
      .withMessage("Category ID must be a number"),
      check("page").notEmpty().withMessage("page is required")
  ],
  validation,
  admin.getItemList
);

router.get("/getItemDetails",
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
router.post("/addStaff",
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
    // check("username")
    //   .not()
    //   .isEmpty()
    //   .withMessage("Username is required")
    //   .trim()
    //   .escape(),
    check("email").isEmail().not()
      .isEmpty()
      .withMessage("email is required").withMessage("Invalid email").normalizeEmail(),
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
router.get( "/getStaffList",
  [
    check("role").not().isEmpty().withMessage("Role is required").isIn(["waiter", "barista", "supervisor"])
      .withMessage("Invalid role"),
      check("page").notEmpty().withMessage("page is required")
  ],
  validation,
  authMiddleware,
  admin.getStaffList
);
router.put("/editStaffProfile", authMiddleware, admin.editStaffProfile); 
router.delete("/deleteStaff",
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
router.get("/getStaffMemberDetail",
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
router.post("/addTable",
  [
    check("table_no")
      .not()
      .isEmpty()
      .withMessage("Table number is required")
      .isNumeric()
      .withMessage("Table number must be a numeric value")
      .isLength({ max: 10 }).withMessage("Table number must be 10 Number long"),
  ],
  validation,
  authMiddleware,
  admin.addTable
);
router.get("/getTableList",  
[  
    check("page").notEmpty().withMessage("page is required")
],
validation,authMiddleware, admin.getTableList
);
router.delete("/removeTable",
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
router.post("/assignWaiterToTables",
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
router.put("/editAssignWaiterToTable",
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
router.get("/waitersTableList",
  [
    check("waiterId")
      .not()
      .isEmpty()
      .withMessage("Waiter ID is required")
      .isNumeric()
      .withMessage("Waiter ID must be a numeric value")
      .toInt(), // Convert to integer
      check("page").notEmpty().withMessage("page is required")
  ],
  validation,
  authMiddleware,
  admin.waitersTableList
);

router.get("/getProfileDetails", authMiddleware, admin.getProfileDetails);
router.get("/getBusinessProfile", authMiddleware, admin.getBusinessProfile);
router.post("/contactUs",
  [
    check("subjects")
      .not()
      .isEmpty()
      .withMessage("Subject is required")
      .trim()
      .escape(),
    check("message")
      .not()
      .isEmpty()
      .withMessage("Message is required")
      .trim()
      .escape(),
  ],
  validation,
  authMiddleware,
  admin.contactUs
);

router.get("/orderDetails",
  [
    check("order_id")
      .not()
      .isEmpty()
      .withMessage("Order ID is required")
      .isNumeric()
      .withMessage("Order ID not valid")
      .trim()
      .escape(),
  ],validation,authMiddleware, admin.orderDetails);

router.get("/orderHistory",
    [
      check("page")
        .not()
        .isEmpty()
        .withMessage("page is required")
        .trim()
        .escape(),
    ],validation,authMiddleware, admin.orderHistory);
router.get("/filter", authMiddleware,admin.filter);
router.post("/addPromoCode",
  // [
  //   check("code")
  //     .not()
  //     .isEmpty()
  //     .withMessage("code is required")
  //     .trim()
  //     .escape(),
  //   check("name")
  //     .not()
  //     .isEmpty()
  //     .withMessage("name is required")
  //     .trim()
  //     .escape(),
  //   check("description")
  //     .not()
  //     .isEmpty()
  //     .withMessage("description is required")
  //     .trim()
  //     .escape(),
  //   check("discount")
  //     .not()
  //     .isEmpty()
  //     .withMessage("discount is required")
  //     .trim()
  //     .escape(),
  //   check("expiresAt")
  //     .not()
  //     .isEmpty()
  //     .withMessage("expiresAt is required")
  //     .trim()
  //     .escape(),
  // ],
  // validation,
  authMiddleware,
  admin.addPromoCode
);
router.get("/getPromoCodes",
  [
    check("page")
      .not()
      .isEmpty()
      .withMessage("page is required")
      .trim()
      .escape(),
  ],
  validation,
  authMiddleware,
  admin.getPromoCodes
);
router.delete("/deletePromoCode",
  [
    check("promoCode_id")
      .not()
      .isEmpty()
      .withMessage("promoCode_id is required")
      .trim()
      .escape(),
  ],
  validation,
  authMiddleware,
  admin.deletePromoCode
);
router.get("/notificationList",
  [
    check('page').notEmpty().withMessage('page is required').isInt({ min: 1 }).withMessage('page input not valid'),
  ],
  validation,
  authMiddleware 
 ,admin.notificationList
);
console.log("im out of admin.js router");
module.exports = router;

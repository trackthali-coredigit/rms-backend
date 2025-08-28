const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth_middleware");
console.log("im in barista router");
const validation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};
const baristas = require("../controllers/barista");


router.get("/BaristaOrderList",[
  check("list_for")
    .not()
    .isEmpty()
    .withMessage("list_for is required")
    .isIn(["current_order", "completed_order"])
    .withMessage("Invalid value for 'value' parameter")
    .trim()
    .escape(),
  check("page")
    .not()
    .isEmpty()
    .withMessage("page is required")
    .trim()
    .escape(),
],validation,authMiddleware,baristas.BaristaOrderList);
router.put("/BaristaOrderAccept",[
    check("order_id")
      .not()
      .isEmpty()
      .withMessage("Order ID is required")
      .isNumeric()
      .withMessage("Order ID must be numeric")
      .trim()
      .escape(),
  ],validation,authMiddleware,baristas.BaristaOrderAccept
  );
router.put("/BaristaOrderMarkAsComplete",[
    check("order_id")
      .not()
      .isEmpty()
      .withMessage("Order ID is required")
      .isNumeric()
      .withMessage("Order ID must be numeric")
      .trim()
      .escape(),
  ],validation,authMiddleware,baristas.BaristaOrderMarkAsComplete
  );

console.log("im out of barista router");
module.exports = router;
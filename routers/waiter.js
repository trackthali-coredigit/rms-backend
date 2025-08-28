const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth_middleware");

console.log("im in waiter router");

const waiters = require("../controllers/waiter");
let validation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get("/waiterOrderList",
  [
    check("page")
      .not()
      .isEmpty()
      .withMessage("page is required")
      .trim()
      .escape(),
  ],validation,authMiddleware, waiters.waiterOrderList);
  router.get("/waiterOrderDetails",
    [
      check("order_id")
        .not()
        .isEmpty()
        .withMessage("Order ID is required")
        .isNumeric()
        .withMessage("Order ID not valid")
        .trim()
        .escape(),
    ],validation,authMiddleware, waiters.waiterOrderDetails);
router.put("/waiterOrderAccept", [
    check("order_id")
      .not()
      .isEmpty()
      .withMessage("Order ID is required")
      .isNumeric()
      .withMessage("Order ID not valid")
      .trim()
      .escape(),
  ],validation,authMiddleware, waiters.waiterOrderAccept
  );
router.put("/waiterOrderComplete",[
    check("order_id")
      .not()
      .isEmpty()
      .withMessage("Order ID is required")
      .isNumeric()
      .withMessage("Order ID not valid")
      .trim()
      .escape(),
  ],validation,authMiddleware, waiters.waiterOrderComplete
  );
router.get("/waiterAssignedTableList",[
  check("page")
    .not()
    .isEmpty()
    .withMessage("page is required")
    .trim()
    .escape(),
],validation,authMiddleware, waiters.waiterAssignedTableList);


console.log("im out of waiter router");
module.exports = router;
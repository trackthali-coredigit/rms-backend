require("sequelize");
const bcrypt = require("bcrypt");
require("dotenv").config();
const common_fun = require("../common/common_fun");
const { Op } = require("sequelize");
const he = require("he");
const jwt = require('jsonwebtoken');
const { sendNotification } = require("../common/notification");
const { emitToSockets } = require("../config/socketConfig")

const userSignUp = async (req, res) => {
  try {
    const { username, email, password, device_id, device_type, device_token } =
      req.body;
    console.log(">>>>>>>im in user sign up", req.body);

    var existingUser = await db.User.findOne({
      where: { email, role: "user", is_deleted: false },
    });

    if (!!existingUser) {
      return res
        .status(200)
        .json({ Status: 0, message: "user already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = await db.User.create({
      username,
      email,
      role: "user",
      otp: otp,
      otp_created_at: new Date(),
      password: hashedPassword,
    });

    await common_fun.sendOTPByEmail(email, otp);

    await db.Token.create({
      user_id: newUser.user_id,
      device_id,
      device_type,
      device_token,
    });

    res
      .status(200)
      .json({
        Status: 1,
        message: "The OTP has been sent to your registered email.",
        otp,
      });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};
const personalInformation = async (req, res) => {
  try {
    const user_id = req.userData.user_id;
    // Find the user based on the user ID
    const user = await db.User.findByPk(user_id);
    if (!user && user.role === "user") {
      return res.status(404).json({ status: 0, message: "User not found" });
    }

    const { first_name, last_name, country_code, iso_code, phone_no } =
      req.body;
    user.first_name = first_name;
    user.last_name = last_name;
    user.country_code = country_code;
    user.iso_code = iso_code;
    user.phone_no = phone_no;
    user.is_account_setup = true;

    const savedUser = await user.save();

    res
      .status(200)
      .json({
        status: 1,
        message: "Your profile has been personalized to perfection!",
        savedUser,
      });
  } catch (error) {
    console.error("Error setting up account:", error);
    res.status(500).json({ status: 0, message: "Internal Server Error" });
  }
};
const confirmOrder = async (req, res) => {
  try {
    let user;
    let user_id;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = req.headers['authorization'].split(' ')[1];

      if (!token) return res.status(401).json({ message: 'Authentication failed ' });


      const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
      user_id = decodedToken.userId
      user = await db.User.findOne({
        where: {
          [Op.and]: [
            { user_id },
            { [Op.or]: [{ role: "admin" }, { role: "user" }] },
          ]
        },
      });
      const tokens = await db.Token.findByPk(decodedToken.tokenId);
      if (!user || !tokens || (tokens.tokenVersion !== decodedToken.tokenVersion)) return res.status(401).json({ error: 'Invalid token' });

    }

    let { orders, business_id, sub_total, discount, taxes, extra_charges, total_price, table_id, special_guest } = req.body;
    const Table = await db.Tables.findOne({ where: { table_id, business_id } });

    const Business = await db.Business.findByPk(business_id);

    if (!Table || !Business) return res.status(200).json({ Status: 0, message: "bussines or table not found" });

    let newOrder;
    let business_details;
    if (authHeader) {
      if (user.role === "user") {
      } else {
        business_id = user.business_id;
      }
    } else {
      user_id = null;
    }
    newOrder = await db.Order.create({
      sub_total,
      discount,
      taxes,
      extra_charges,
      business_id,
      total_price,
      table_id,
      order_status: "in_progress",
      user_id,
      special_guest,
    });
    business_details = await db.Business.findAll({ where: { business_id } });


    // Process each item in the orders array
    for (const order of orders) {
      const { item_id, item_image, quantity, note, price, item_name } = order;
      const item = await db.Items.findByPk(item_id);
      if (!item) return res.status(200).json({ status: 0, message: "item not found" });

      // Store the order item in the database
      await db.Order_Item.create({
        order_id: newOrder.order_id, // Assign the newly created order_id
        item_id,
        item_image: he.decode(item_image),
        quantity,
        note,
        price,
        item_name,
      });

      const newStock = item.stock - quantity;
      if (item.stock < quantity) {
        return res.status(200).json({
          status: 0,
          message: `quantity is not valid for ${item_name}`,
        });
      }
      await item.update({ stock: newStock });
    }

    const created = await db.Notification.create({
      notification_from: user_id,
      notification_to: user_id,
      order_id: newOrder.order_id,
      title: "Order Placed",
      notification_message: `your order has been placed`,
      notification_type: "Order Placed"
    });
    if (special_guest) {
      console.log("????????????????????????????????????sg", special_guest);
      const users = await db.User.findAll({
        attributes: ["user_id"],
        where: {
          business_id,
          role: {
            [Op.in]: ["admin", "supervisor"]
          },
          // user_id: {
          //   [Op.ne]: user_id
          // }
        }
      })
      console.log("<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>users", users);
      const supervisorAdminArray = [];
      for (const user of users) {
        supervisorAdminArray.push(user.dataValues.user_id);
        const created = await db.Notification.create({
          notification_from: user_id,
          notification_to: user.user_id,
          order_id: newOrder.order_id,
          title: "Order Placed",
          notification_message: `special guest order has been placed`,
          notification_type: "Order Placed"
        });
      }
      console.log("<<<array", supervisorAdminArray);
      await sendNotification(
        supervisorAdminArray,
        `special guest order has been placed`,
        {
          order_id: newOrder.order_id,
          notification_type: "Order Placed"
        }
      );
    } else {

      /////////////////////////////////
      const message = `your order has been placed`;
      const data = {
        order_id: newOrder.order_id,
        notification_type: "Order Placed"
      };
      console.log("MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM", user_id);
      await sendNotification(
        [user_id],
        message,
        data
      );
    }
    /////////////////////////////////
    const users = await db.User.findAll({
      attributes: ["user_id"],
      where: {
        business_id,
        role: "barista"
      }
    })
    const row = await db.Order.findOne({
      where: { order_id: newOrder.order_id },
      include: [
        {
          model: db.Order_Item,
          required: true,
        },
        {
          model: db.User,
          attributes: ['user_id', 'username', 'first_name', 'last_name'],
          required: false,
        }
      ],
      distinct: true,
    });
    const usersArray = [];
    const notifications = users.map(user => {
      usersArray.push(user.dataValues.user_id);
      emitToSockets(user.dataValues.user_id, "brista_new_order", row);
      return {
        notification_from: user_id,
        notification_to: user.user_id,
        order_id: newOrder.order_id,
        title: "new order arrive",
        notification_message: `new order wait for your accept`,
        notification_type: "Barista Accept"
      };
    });
    await db.Notification.bulkCreate(notifications);
    console.log(">>>>>>>array", usersArray);
    await sendNotification(
      usersArray,
      "new order wait for your accept",
      {
        order_id: newOrder.order_id,
        notification_type: "Barista Accept"
      }
    );
    return res
      .status(200).json({
        status: 1,
        message: "Order confirmed successfully",
        order_id: newOrder.order_id,
        business_details,
      });
  } catch (error) {
    console.error("Error confirming order:", error);
    return res
      .status(500)
      .json({ status: 0, message: "Internal Server Error" });
  }
};
// const delete_account = async (req, res) => {
//   try {
//     const user_id = req.userData.user_id;
//   if(req.userData.role != "user") return res.status(401).json({ Status: 0, message: "Account deleted successfully" });
//     await db.Token.destroy({ where: { user_id } });
//     await req.userData.destroy();
//     res.status(200).json({ Status: 1, message: "Anauthorize" });
//   } catch (error) {
//     console.error("Error deleting account:", error);
//     res.status(500).json({ Status: 0, message: "Internal Server Error" });
//   }
// };
const delete_account = async (req, res) => {
  try {
    console.log(" req.body>>>>>>", req.query);
    
    //    const user_id = req.userData.user_id;
    const { emailOrUsername, password } = req.query;
    let user = await db.User.findOne({
      where: {
        [Op.or]: [{ email: emailOrUsername },
        { username: emailOrUsername }],
        role: "user",
        is_deleted: false,
      },
    });
    if (!user) return res.status(200).json({ Status: 0, message: "The User Not Found or not verified" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(200).json({ Status: 0, message: "Invalid Sign-In Credentials!" });

    await db.Token.destroy({ where: { user_id : user.user_id } });
    await user.update({ is_deleted: true });

    res.status(200).json({ Status: 1, message: "Account deleted succesfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};
const getUserOrderList = async (req, res) => {
  try {

    const user_id = req.userData.user_id;

    const user = await db.User.findOne({
      where: {
        [Op.and]: [{ user_id }, { role: "user" }],
      },
    });
    if (!user) {
      return res.status(404).json({ Status: 0, message: "User not found" });
    }
    const { page, order_status } = req.body;
    const pageSize = 20;
    let currentPage = parseInt(page, 10) || 1;
    if (currentPage < 1) currentPage = 1;

    const offset = (currentPage - 1) * pageSize;
    let whereClause;
    if (order_status === "in_progress") {
      whereClause = {
        [Op.and]: [
          { user_id },
          {
            [Op.or]: [
              { order_status: "in_progress" },
              { order_status: "in_making" },
              { order_status: "ready_to_serve" },
              { order_status: "waiter_asigned" },
            ],
          },
        ],
      }
    } else if (order_status === "complete") {
      whereClause = { user_id, order_status: "complete" }
    }
    const { count, rows } = await db.Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Order_Item,
          required: false,
        },
        {
          model: db.Business,
          required: false,
        },
      ], // Include order items in the response
      distinct: true,
      limit: pageSize,
      offset,
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / pageSize);

    return res.status(200).json({
      status: 1,
      current_page: currentPage,
      total_pages: totalPages,
      orders: rows,
    });
  } catch (error) {
    console.error("Error fetching user order list:", error);
    return res
      .status(500)
      .json({ status: 0, message: "Internal Server Error" });
  }
};
const applyPromoCode = async (req, res) => {
  const { code, business_id } = req.body;
  try {
    const promoCode = await db.PromoCode.findOne({
      where: {
        code,
        business_id,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!promoCode) {
      return res.status(200).json({ Status: 0, message: 'Promo code not found or expired' });
    }

    console.log("req.body.code", req.body.code);
    console.log("promoCode.code", promoCode.code);
    console.log(req.body.code === promoCode.code);
    if (!(req.body.code === promoCode.code)) {
      return res.status(200).json({ status: 0, message: "Invalid Promo Code" });
    }


    return res.status(200).json({ Status: 1, message: 'Promo Code apply succesfully', discount: promoCode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Status: 0, message: 'Internal server error' });
  }
};
const expensesList = async (req, res) => {
  try {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    const user_id = req.userData.user_id;
    console.log("req.query", req.query);
    const pageSize = 20;
    let currentPage = parseInt(req.query.page, 10) || 1;
    if (currentPage < 1) currentPage = 1;
    const offset = (currentPage - 1) * pageSize;

    const { count, rows } = await db.Order.findAndCountAll({
      attributes: [
        'business_id',
        [db.sequelize.fn('SUM', db.sequelize.col('total_price')), 'total_amount'],
        [db.sequelize.col('business_model.business_name'), 'business_name'],
        [db.sequelize.col('business_model.business_email'), 'business_email'],
      ],
      where: { user_id },
      include: [
        {
          model: db.Business,
          // attributes: ['business_id',"business_name","business_email"],
          attributes: [],
          required: false,
        },
      ], // Include order items in the response
      group: ['order_model.business_id'],
      distinct: true,
      limit: pageSize,
      offset,
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / pageSize);
    return res.status(200).json({
      Status: 1,
      message: "expensesList get succesfully",
      current_page: currentPage,
      total_pages: totalPages,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Status: 0, message: 'Internal server error' });
  }
};

module.exports = {
  userSignUp,
  personalInformation,
  confirmOrder,
  delete_account,
  getUserOrderList,
  applyPromoCode,
  expensesList
};

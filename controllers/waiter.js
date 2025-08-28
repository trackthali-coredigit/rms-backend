require("sequelize");
require("dotenv").config();
const { Op } = require("sequelize");
const { sendNotification } = require("../common/notification");

const waiterOrderList = async (req, res) => {
  try {
    const user_id = req.userData.user_id;
    if (req.userData.role != "waiter") {
      return res.status(404).json({ Status: 0, message: "waiter not found" });
    }
    const { page } = req.body;
    const pageSize = 20;
    let currentPage = parseInt(page, 10) || 1;
    if (currentPage < 1) currentPage = 1;

    const offset = (currentPage - 1) * pageSize;
    const { count, rows } = await db.Order.findAndCountAll({
      where: {
        [Op.and]: [
          {
            business_id: req.userData.business_id,
            [Op.or]: [
              { order_status: "ready_to_serve" },
              { order_status: "waiter_asigned" },
            ],
          },
        ],
      },
      include: [
        {
          model: db.Order_Item,
          required: true,
        },
        {
          model: db.User,
          attributes: ['user_id', 'username', 'first_name', 'last_name'],
          required: false,
        },
        {
          model: db.Business,
          required: false,
        },
      ],
      distinct: true,
      limit: pageSize,
      offset,
      order: [["updatedAt", "DESC"]],
    });
    let notificationCount = await db.Notification.count({ where: { notification_to: user_id, status: "Unread" } });
    const totalPages = Math.ceil(count / pageSize);
    res
      .status(200)
      .json({
        Status: 1, message: "WaiterOrderList get successfully",
        current_page: currentPage,
        total_pages: totalPages,
        orders: rows,
        notificationCount,
      });
  } catch (error) {
    console.error("Error fetching order list:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};
const waiterOrderDetails = async (req, res) => {
  try {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>IM IN waiterOrderDetails api");

    const user_id = req.userData.user_id;

    if (req.userData.role != "waiter") {
      return res.status(404).json({ Status: 0, message: "waiter not found" });
    }
    const is_exist = await db.Order.findByPk(req.query.order_id)
    if (!is_exist) {
      return res.status(404).json({ Status: 0, message: "Order not found" })
    }
    const OrderDetails = await db.Order.findOne({
      where: {
        [Op.and]: [
          {
            business_id: req.userData.business_id,
            order_id: req.query.order_id,
            [Op.or]: [
              { order_status: "ready_to_serve" },
              { order_status: "waiter_asigned" },
              { order_status: "complete" },
            ],
          },
        ],
      },
      include: [
        {
          model: db.Order_Item,
          required: true,
        },
        {
          model: db.User,
          attributes: ['user_id', 'username', 'first_name', 'last_name'],
          required: false,
        },
        {
          model: db.Business,
          required: false,
        },
      ],
    });
    res
      .status(200)
      .json({
        Status: 1, message: "WaiterOrderDetails get successfully",
        OrderDetails
      });
  } catch (error) {
    console.error("Error fetching order list:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};
const waiterOrderAccept = async (req, res) => {
  try {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>IM IN waiterOrderAccept api");

    const user_id = req.userData.user_id;

    if (req.userData.role != "waiter") {
      return res.status(404).json({ Status: 0, message: "waiter not found" });
    }
    const order = await db.Order.findByPk(req.body.order_id);
    if (!order) {
      return res.status(404).json({ Status: 0, message: "Order not found" });
    }

    await order.update({ waiter_id: user_id, order_status: "waiter_asigned" });


    if (order.special_guest) {
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>order.special_guest");
      const users = await db.User.findAll({
        attributes: ["user_id"],
        where: {
          business_id: order.business_id,
          role: {
            [Op.in]: ["admin", "supervisor"]
          },
        }
      })
      const supervisorAdminArray = [];
      for (const user of users) {
        supervisorAdminArray.push(user.dataValues.user_id);
        const created = await db.Notification.create({
          notification_from: user_id,
          notification_to: user.user_id,
          order_id: order.order_id,
          title: "Waiter Accepted",
          notification_message: `special guest order has been accept by waiter`,
          notification_type: "Waiter Accepted"
        });
      }
      console.log("<<<array", supervisorAdminArray);
      await sendNotification(
        supervisorAdminArray,
        `special guest order has been accept by waiter`,
        {
          order_id: order.order_id,
          notification_type: "Waiter Accepted"
        }
      );
    } else {
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> not special_guest");
      const created = await db.Notification.create({
        notification_from: user_id,
        notification_to: order.user_id,
        title: "Waiter Accepted",
        order_id: req.body.order_id,
        notification_message: "your order has been accept by waiter",
        notification_type: "Waiter Accepted"
      });

      await sendNotification(
        [order.user_id],
        `your order has been accept by waiter`,
        {
          order_id: req.body.order_id,
          notification_type: "Waiter Accepted"
        }
      );
    }
    res.status(200).json({ Status: 1, message: "Order Accepted Successfully" , waiter_id: user_id});
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};
const waiterOrderComplete = async (req, res) => {
  try {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>IM IN waiterOrderComplete api");

    const user_id = req.userData.user_id;

    if (req.userData.role != "waiter") {
      return res.status(200).json({ Status: 0, message: "waiter not found" });
    }
    // Update the order with the waiter's ID
    const order = await db.Order.findOne({
      where: { 
        order_id: req.body.order_id, 
        waiter_id: user_id },
    });
    if (!order) {
      return res.status(200).json({ Status: 0, message: "Order not found or assigned to another waiter"});
    }

    await order.update({ order_status: "complete" });
    if (order.special_guest) {
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>order.special_guest");
      const users = await db.User.findAll({
        attributes: ["user_id"],
        where: {
          business_id: order.business_id,
          role: {
            [Op.in]: ["admin", "supervisor"]
          },
        }
      })
      const supervisorAdminArray = [];
      for (const user of users) {
        supervisorAdminArray.push(user.dataValues.user_id);
        const created = await db.Notification.create({
          notification_from: user_id,
          notification_to: user.user_id,
          order_id: order.order_id,
          title: "Order Complete",
          notification_message: `special guest order has been complete!`,
          notification_type: "Order Complete"
        });
      }
      console.log("<<<array", supervisorAdminArray);
      await sendNotification(
        supervisorAdminArray,
        `special guest order has been complete!`,
        {
          order_id: order.order_id,
          notification_type: "Order Complete"
        }
      );
    } else {
      const created = await db.Notification.create({
        notification_from: user_id,
        notification_to: order.user_id,
        title: "Order Complete",
        order_id: req.body.order_id,
        notification_message: "your order has been complete!",
        notification_type: "Order Complete"
      });

      await sendNotification(
        [order.user_id],
        `your order has been complete!`,
        {
          order_id: req.body.order_id,
          notification_type: "Order Complete"
        }
      );
    }
    res.status(200).json({ Status: 1, message: "Order marked as paid successfully" });
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};
const waiterAssignedTableList = async (req, res) => {
  try {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>IM IN waiterAssignedTableList api");

    const user_id = req.userData.user_id;

    if (req.userData.role != "waiter") {
      return res.status(404).json({ Status: 0, message: "waiter not found" });
    }
    const { page } = req.body;
    const pageSize = 20;
    let currentPage = parseInt(page, 10) || 1;
    if (currentPage < 1) currentPage = 1;

    const offset = (currentPage - 1) * pageSize;

    // const { count, rows } = await db.Tables.findAndCountAll({

    //   where: {
    //     business_id: req.userData.business_id,
    //   },
    //   include: [
    //     {
    //       model: db.User,
    //       required: true,
    //       where: {
    //         user_id: user_id,
    //       },
    //     },
    //   ],
    //   distinct: true,
    //   limit: pageSize,
    //   offset,
    //   order: [["createdAt", "DESC"]],
    // });
    const { count, rows } = await db.Tables.findAndCountAll({

      where: {
        business_id: req.userData.business_id,
      },
      attributes: ["table_id", "business_id", "table_no"],
      include: [
        {
          model: db.Waiter,
          required: true,
          where: { user_id },
          attributes: ["user_id", "table_id", "id","createdAt"],
          include: [
            {
              model: db.User,
              // required: true,
              // where: {
              //   user_id: user_id,
              // },
              attributes: ["user_id", "first_name", "last_name", "email", "phone_no", "role"],
            },
          ],
        },],
      distinct: true,
      limit: pageSize,
      offset,
      order: [[`waiter_models`,`createdAt`, "DESC"]],
    });
    const totalPages = Math.ceil(count / pageSize);

    res
      .status(200)
      .json({
        Status: 1,
        message: "WaiterAssignedTableList get successfully",
        current_page: currentPage,
        total_pages: totalPages,
        tables: rows,
      });
  } catch (error) {
    console.error("Error fetching waiter assigned table list:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};

module.exports = {
  waiterOrderList,
  waiterOrderDetails,
  waiterOrderAccept,
  waiterOrderComplete,
  waiterAssignedTableList,
};

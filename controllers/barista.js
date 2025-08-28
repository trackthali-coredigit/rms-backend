require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fs = require("fs");
const { Op } = require("sequelize");
const { sendNotification } = require("../common/notification");
const { emitToSockets } = require("../config/socketConfig");
const BaristaOrderList = async (req, res) => {
  try {
    const user_id = req.userData.user_id;

    const user = await db.User.findOne({
      where: {
        [Op.and]: [{ user_id }, { role: "barista" }],
      },
    });
    if (!user) {
      return res.status(404).json({ Status: 0, message: "Barista not found" });
    }

    const { page, list_for } = req.body;
    const pageSize = 20;
    let currentPage = parseInt(page, 10) || 1;
    if (currentPage < 1) currentPage = 1;

    const offset = (currentPage - 1) * pageSize;
    let whereClause;
    if (list_for === "current_order") {
      whereClause = {
        [Op.and]: [
          {
            business_id: user.business_id,
            [Op.or]: [
              { order_status: "in_progress" },
              { order_status: "in_making" },
            ],
          },
        ],
      }
    } else if (list_for === "completed_order") {
      whereClause = {
        [Op.and]: [
          {
            business_id: user.business_id,
            barista_id: user_id,
            [Op.or]: [
              { order_status: "ready_to_serve" },
              { order_status: "waiter_asigned" },
              { order_status: "complete" },
            ],
          },
        ],
      }
    }
    const { count, rows } = await db.Order.findAndCountAll({
      where: whereClause,
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
      limit: pageSize,
      offset,
      order: [["updatedAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / pageSize);

    res.status(200).json({
      Status: 1,
      message: "BaristaOrderList get successfully",
      current_page: currentPage, total_pages: totalPages, orders: rows,
    });
  } catch (error) {
    console.error("Error fetching order list:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};
const BaristaOrderAccept = async (req, res) => {
  try {
    const user_id = req.userData.user_id;
    const user = req.userData;

    if (req.userData.role != "barista") {
      return res.status(404).json({ Status: 0, message: "Barista not found" });
    }
    // Update the order with the barista's ID
    const order = await db.Order.findByPk(req.body.order_id);
    if (!order) {
      return res.status(404).json({ Status: 0, message: "Order not found" });
    }

    await order.update({ barista_id: user_id, order_status: "in_making" });



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
        // console.log("VVVVVVVVV", user.dataValues.user_id);
        const created = await db.Notification.create({
          notification_from: user_id,
          notification_to: user.user_id,
          order_id: order.order_id,
          title: "Barista Accepted",
          notification_message: `special guest order has been accept by barista`,
          notification_type: "Barista Accepted"
        });
      }
      console.log("<<<array>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", supervisorAdminArray);
      await sendNotification(
        supervisorAdminArray,
        `special guest order has been accept by barista`,
        {
          order_id: order.order_id,
          notification_type: "Barista Accepted"
        }
      );
    } else {
      console.log("not special guest");

      const created = await db.Notification.create({
        notification_from: user_id,
        notification_to: order.user_id,
        title: "Barista Accepted",
        order_id: req.body.order_id,
        notification_message: "your order has been accept by barista",
        notification_type: "Barista Accepted"
      });
      
      await sendNotification(
        [order.user_id],
        `your order has been accept by barista`,
        {
          order_id: order.order_id,
          notification_type: "Barista Accepted"
        }
      );
    }
    res.status(200).json({ Status: 1, message: "Order accepted successfully" ,barista_id: user_id});
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};
const BaristaOrderMarkAsComplete = async (req, res) => {
  try {
    console.log("bbbbbbbbbbbbbbbbbb");
    const user_id = req.userData.user_id;
    const orderId = req.body.order_id;

    if (req.userData.role != "barista") {
      return res.status(404).json({ Status: 0, message: "Barista not found" });
    }
    console.log("bbbbbbbbbbbbbbbbbb",req.userData.role);
    // Find the order and check if the barista_id matches the user_id
    const order = await db.Order.findOne({
      where: {
        order_id: orderId,
        barista_id: user_id,
      },
    });
    if (!order) {
      return res.status(200).json({
          Status: 0,
          message: "Order not found or not assigned to another barista",
        });
    }
    console.log("bbbbbbbbbbbbbbbbbb",order);
    // Update the order status to "ready_to_serve"
    await order.update({ order_status: "ready_to_serve" });

    // const created = await db.Notification.create({
    //   notification_from: user_id,
    //   notification_to: order.user_id,
    //   title: "Ready To Serve",
    //   order_id: req.body.order_id,
    //   notification_message: "your order has Ready for Serve",
    //   notification_type: "Ready To Serve"
    // });
    if (order.special_guest) {
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
          title: "Ready To Serve",
          notification_message: `special guest order has been Ready for Serve`,
          notification_type: "Ready To Serve"
        });
      }
      console.log("<<<<<<<<<<array", supervisorAdminArray);
      await sendNotification(
        supervisorAdminArray,
        `special guest order has been Ready for Serve`,
        {
          order_id: order.order_id,
          notification_type: "Ready To Serve"
        }
      );
    } else {
      console.log("not special guest");

      const created = await db.Notification.create({
        notification_from: user_id,
        notification_to: order.user_id,
        title: "Ready To Serve",
        order_id: req.body.order_id,
        notification_message: "your order has Ready for Serve",
        notification_type: "Ready To Serve"
      });

      await sendNotification(
        [order.user_id],
        `your order has Ready for Serve`,
        {
          order_id: order.order_id,
          notification_type: "Ready To Serve"
        }
      );
    }

    const users = await db.User.findAll({
      attributes: ["user_id"],
      where: {
        business_id: req.userData.business_id,
        role: "waiter"
      },
      include: [{
        model: db.Waiter,
        required: true,
        where: { table_id: order.table_id },
        // attributes: ["order_id"]
      }]
    })

    const row = await db.Order.findOne({
      where: { order_id: order.order_id},
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
      emitToSockets(user.dataValues.user_id, "waiter_new_order", row);
      return {
        notification_from: req.userData.user_id,
        notification_to: user.user_id,
        title: "Ready to serve",
        order_id: req.body.order_id,
        notification_message: "new order wait for your accept",
        notification_type: "Ready to serve"
      };
    });
    await db.Notification.bulkCreate(notifications);
    await sendNotification(
      usersArray,
      "new order wait for your accept",
      {
        order_id: order.order_id,
        notification_type: "Ready to serve"
      }
    );
    res.status(200).json({ Status: 1, message: "Order marked as complete successfully" });
  } catch (error) {
    console.error("Error marking order as complete:", error);
    res.status(500).json({ Status: 0, message: "Internal Server Error" });
  }
};

module.exports = {
  BaristaOrderList,
  BaristaOrderAccept,
  BaristaOrderMarkAsComplete,
};

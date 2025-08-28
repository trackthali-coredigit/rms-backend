module.exports = (sequelize, DataTypes, Model) => {
    const Notification = sequelize.define('notification_model', {
        // Model attributes are defined here
        notification_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        notification_from: {
            type: DataTypes.INTEGER,
            references: {
                model: 'tbl_users',
                key: 'user_id'
            }
        },
        notification_to: {
            type: DataTypes.INTEGER,
            references: {
                model: 'tbl_users',
                key: 'user_id'
            },
            defaultValue: null
        },
        order_id: {
            type: DataTypes.INTEGER,
            references: {
              model: "tbl_order",
              key: "order_id",
            },
            defaultValue: null
          },
        title: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        notification_message: {
            type: DataTypes.TEXT('long'),
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        notification_type: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.ENUM("Read", "Unread"),
            defaultValue: "Unread"
        },
        read_at: {
            type: DataTypes.DATE,
            defaultValue: null
        },

    }, {
        // Other model options go here
        tableName: "tbl_notification",
        timestamps: true,
    });

    return Notification;
}
// console.log('<<<<<<<<<<<<<<<<<<<<messageStatus',messageStatus);
// const chatData = {
//   message_by: user_id,
//   message_to: other_id,
//   chat_id: chat_id,
//   message_type: message_type,
//   message_status: messageStatus,
//   message_text:message_text,
//   read_at: messageStatus == "Read" ? Date.now() : null,
// };
// var messageData = await db.Message.create(chatData);
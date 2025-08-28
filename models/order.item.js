module.exports = (sequelize, DataTypes) => {
  const Order_Item = sequelize.define(
    "order_items_model",
    {
      orderItem_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Sequelize will automatically set this as auto-increment since it's the primary key
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "tbl_order",
          key: "order_id",
        },
      },
      item_id: {
        type: DataTypes.INTEGER,
        // references: {
        //   model: "tbl_item",
        //   key: "item_id",
        // },
      },
      item_image:{
        type: DataTypes.STRING,
        defaultValue: null,
      },
      note:{
        type: DataTypes.STRING,
        defaultValue: null,
      },
      quantity: {
        type: DataTypes.INTEGER,
      },
      price:{
        type: DataTypes.DOUBLE,
      },
      item_name:{
        type: DataTypes.STRING,
      }
    },
    {
      tableName: "tbl_order_items",
      timestamps: true,
    }
  );

  return Order_Item;
};

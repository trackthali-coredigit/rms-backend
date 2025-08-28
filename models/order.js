module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "order_model",
    {
      order_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Sequelize will automatically set this as auto-increment since it's the primary key
        allowNull: false,
      },
      business_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "tbl_business",
          key: "business_id",
        },
      },
      table_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "tbl_table",
          key: "table_id",
        },
        defaultValue: null,
      },
      order_status:{
        type: DataTypes.ENUM("in_progress","in_making","ready_to_serve","waiter_asigned","complete"),
        isIn: {
            args: [["in_progress","in_making","ready_to_serve","waiter_asigned","complete"]],
            msg: "select valid role",
          },
      },
      total_price: {
        type: DataTypes.DOUBLE,
      },
      sub_total: {
        type: DataTypes.DOUBLE,
      },
      discount: {
        type: DataTypes.DOUBLE,
      },
      taxes: {
        type: DataTypes.DOUBLE,
      },
      extra_charges: {
        type: DataTypes.DOUBLE,
      },
      payment_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        references : {
          model :'tbl_users', 
          key: 'user_id'
        },
      },
      barista_id: {
        type: DataTypes.INTEGER,
        references : {
          model :'tbl_users', 
          key: 'user_id'
        },
        defaultValue: null,
      },
      waiter_id: {
        type: DataTypes.INTEGER,
        references : {
          model :'tbl_users', 
          key: 'user_id'
        },
        defaultValue: null,
      },
      special_guest: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "tbl_order",
      timestamps: true,
    }
  );

  return Order;
};

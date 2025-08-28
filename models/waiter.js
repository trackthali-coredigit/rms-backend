module.exports = (sequelize, DataTypes, Model) => {
  const Waiter = sequelize.define(
    "waiter_model",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "tbl_users",
          key: "user_id",
        },
      },
      table_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "tbl_table",
          key: "table_id",
        },
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "tbl_waiter",
      timestamps: true,
    }
  );

  return Waiter;
};

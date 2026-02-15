module.exports = (sequelize, DataTypes, Model) => {
  const Items = sequelize.define(
    "item_model",
    {
      item_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      business_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "tbl_business",
          key: "business_id",
        },
      },
      category_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "tbl_category",
          key: "category_id",
        },
      },
      item_name: {
        type: DataTypes.STRING,
      },
      price: {
        type: DataTypes.DOUBLE,
      },
      stock: {
        type: DataTypes.BIGINT,
      },
       discount: {
         type: DataTypes.DOUBLE,
         defaultValue: 0,
         allowNull: true,
       },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "tbl_item",
      timestamps: true,
    }
  );
  return Items;
};

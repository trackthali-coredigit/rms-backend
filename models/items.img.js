module.exports = (sequelize, DataTypes, Model) => {
    const Item_Img = sequelize.define(
      "item_img_model",
      {
        item_img_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        item_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "tbl_item",
            key: "item_id",
          },
        },
        image: {
          type: DataTypes.STRING,
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        tableName: "tbl_item_img",
        timestamps: true,
      }
    );
    return Item_Img;
  };
  
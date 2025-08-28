module.exports = (sequelize, DataTypes, Model) => {
    const Ingrediant = sequelize.define(
      "ingrediant_model",
      {
        ingrediant_id: {
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
        name: {
          type: DataTypes.STRING,
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        tableName: "tbl_ingrediant",
        timestamps: true,
      }
    );
    return Ingrediant;
  };
  
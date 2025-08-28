module.exports = (sequelize, DataTypes) => {
  const QRs = sequelize.define(
    "qrs_model",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, 
        allowNull: false,
      },
      qr_id: {
        type: DataTypes.STRING,
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
      },
    },
    {
      tableName: "tbl_qrs",
      timestamps: true,
    }
  );

  return QRs;
};

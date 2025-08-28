module.exports = (sequelize, DataTypes) => {
  const Tables = sequelize.define(
    "Tables_model",
    {
      table_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Sequelize will automatically set this as auto-increment since it's the primary key
        allowNull: false,
      },
      business_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'tbl_business',
          key: 'business_id'
        },
      },
      table_no: {
        type: DataTypes.BIGINT,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'tbl_table',
      timestamps: true
    }
  );

  return Tables;
};

    
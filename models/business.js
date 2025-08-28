module.exports = (sequelize, DataTypes, Model) => {
  const Business = sequelize.define(
    "business_model",
    {
      business_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      business_name: {
        type: DataTypes.STRING,
      },
      business_email: {
        type: DataTypes.STRING,
        unique: false, // Ensure uniqueness of email addresses
        validate: {
          isEmail: true, // Validate email format using built-in validator
        },
      },
      iso_code: {
        type: DataTypes.STRING,
      },
      country_code: {
        type: DataTypes.STRING,
      },
      business_phone_no: {
        type: DataTypes.BIGINT,
      },
      business_image: {
        type: DataTypes.STRING,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "tbl_business",
      timestamps: true,
    }
  );
  return Business;
};

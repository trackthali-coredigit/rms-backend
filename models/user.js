module.exports = (sequelize, DataTypes, Model) => {
  const User = sequelize.define(
    "users_model",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      business_id: {
        type: DataTypes.INTEGER,
        references : {
          model :'tbl_business', 
          key: 'business_id'
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: false, // Ensure uniqueness of email addresses
        validate: {
          isEmail: true, // Validate email format using built-in validator
        },
      },
      password: {
        type: DataTypes.STRING,
      },
      username: {
        type: DataTypes.STRING,
      },
      otp: {
        type: DataTypes.INTEGER,
      },
      otp_created_at: { // New field for OTP creation timestamp
        type: DataTypes.DATE,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("super_admin", "admin","waiter", "barista", "supervisor","user"),
        isIn: {
          args: [["super_admin", "admin","waiter", "barista", "supervisor","user"]],
          msg: "select valid role",
        },
      },
      is_verify: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, 
      },
      is_account_setup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, 
      },
      first_name: {
        type: DataTypes.STRING,
      },
      last_name: {
        type: DataTypes.STRING,
      },
      iso_code: {
        type: DataTypes.STRING,
      },
      country_code: {
        type: DataTypes.STRING,
      },
      phone_no: {
        type: DataTypes.BIGINT,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue:false,
      },
    },
    {
      tableName: "tbl_users",
      timestamps: true,
    }
  );
  return User;
};

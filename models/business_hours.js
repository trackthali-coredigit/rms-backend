module.exports = (sequelize, DataTypes, Model) => {
    const BusinessHours = sequelize.define(
      "business_hours_model",
      {
        business_hours_id: {
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
        day: {
            type: DataTypes.ENUM("monday","tuesday","wednesday","thursday","friday","saturday","sunday"),
            isIn: {
                args: [["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]],
                msg: "select valid role",
              },
          },
          day_status: {
            type: DataTypes.BOOLEAN,
            defaultValue:false,
          },
          opening_hours: {
            type: DataTypes.TIME,
          },
          closing_hours: {
            type: DataTypes.TIME,
          },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          defaultValue:false,
        },
      },
      {
        tableName: "tbl_business_hours",
        timestamps: true,
      }
    );
    return BusinessHours;
  };
  
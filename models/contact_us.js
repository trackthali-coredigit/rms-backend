module.exports = (sequelize,DataTypes,Model) =>{
    const Contact_Us = sequelize.define(
      "contact_us_model",
      {
        contact_us_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,    
          autoIncrement: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.INTEGER,
          references : {
            model :'tbl_users', 
            key: 'user_id'
          },
        },
        subjects: {
          type: DataTypes.STRING,
        },
        message: {
          type: DataTypes.STRING,
        },
      },
      {
        tableName: 'tbl_contact_us',
        timestamps: true
      }
    );
    
    return Contact_Us;
    }
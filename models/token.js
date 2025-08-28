module.exports = (sequelize,DataTypes,Model) =>{
    const Token = sequelize.define(
      "tokens_model",
      {
        token_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,    
          autoIncrement: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.INTEGER,
          references : {
            model :'tbl_users', 
            key: 'user_id',
            onDelete: 'CASCADE',
          },
        },
        device_id: {
          type: DataTypes.STRING,
        },
        device_type: {
          type: DataTypes.STRING,
        },
        device_token: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: false, 
        },
        tokenVersion: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false, 
        },
      },
      {
        tableName: 'tbl_tokens',
        timestamps: true
      }
    );
    
    return Token;
    }
    
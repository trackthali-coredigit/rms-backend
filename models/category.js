module.exports = (sequelize,DataTypes,Model) =>{
    const Category = sequelize.define(
      "category_model",
      {
        category_id: {
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
        category_name: {
          type: DataTypes.STRING,
        },
        // is_deleted: {
        //   type: DataTypes.BOOLEAN,
        //   defaultValue: false, 
        // },
      },
      {
        tableName: 'tbl_category',
        timestamps: true
      }
    );
    
    return Category;
    }
    
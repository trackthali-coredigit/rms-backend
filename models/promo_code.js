module.exports = (sequelize, DataTypes, Model) => {
    const PromoCode = sequelize.define(
        "promoCode_model",
        {
            promoCode_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'tbl_users',
                    key: 'user_id'
                },
            },
            business_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: "tbl_business",
                    key: "business_id",
                },
            },
            code: {
                type: DataTypes.STRING,
            },
            name: {
                type: DataTypes.STRING,
            },
            description: {
                type: DataTypes.STRING,
            },
            discount: {
                type: DataTypes.INTEGER,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
            // promoCodeType: {
            //     type: DataTypes.STRING,
            // },
            // promoCodeValue: {
            //     type: DataTypes.STRING,
            // },
            // promoCodeStatus: {
            //     type: DataTypes.STRING,
            // },
            // promoCodeStartDate: {
            //     type: DataTypes.DATE,
            // },
            // promoCodeEndDate: {
            //     type: DataTypes.DATE,
            // },
            // promoCodeMaxRedeem: {
            //     type: DataTypes.INTEGER,
            // },
            // promoCodeMaxRedeemPerUser: {
            //     type: DataTypes.INTEGER,
            // },
            // promoCodeMaxRedeemPerBusiness: {
            //     type: DataTypes.INTEGER,
            // },
            // promoCodeMaxRedeemPerBusinessPerUser: {
            //     type: DataTypes.INTEGER,
            // },
        },
        {
            tableName: "tbl_promoCode",
            timestamps: true,
        }
    );
    return PromoCode;
};

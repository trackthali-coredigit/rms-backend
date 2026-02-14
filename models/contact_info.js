module.exports = (sequelize, DataTypes, Model) => {
	const Contact_Info = sequelize.define(
		"contact_info_model",
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			user_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_users",
					key: "user_id",
				},
				allowNull: false,
			},
			business_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_business",
					key: "business_id",
				},
				allowNull: false,
			},
			subject: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			message: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
		},
		{
			tableName: "tbl_contact_info",
			timestamps: true,
		}
	);

	return Contact_Info;
};

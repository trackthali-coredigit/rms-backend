module.exports = (sequelize, DataTypes, Model) => {
	const Ingrediant = sequelize.define(
		"ingrediant_model",
		{
			ingrediant_id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			item_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_item",
					key: "item_id",
				},
			},
			price: {
				type: DataTypes.DOUBLE,
				defaultValue: 0.0,
				allowNull: true,
			},
			quantity: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				allowNull: true,
			},
			name: {
				type: DataTypes.STRING,
			},
			is_deleted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			tableName: "tbl_ingrediant",
			timestamps: true,
		}
	);
	return Ingrediant;
};

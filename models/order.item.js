module.exports = (sequelize, DataTypes) => {
	const Order_Item = sequelize.define(
		"order_items_model",
		{
			orderItem_id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true, // Sequelize will automatically set this as auto-increment since it's the primary key
				allowNull: false,
			},
			ingrediant_id: {
				type: DataTypes.INTEGER,
				defaultValue: null,
				references: {
					model: "tbl_ingrediant",
					key: "ingrediant_id",
				},
			},
			business_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_business",
					key: "business_id",
				},
			},
			order_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_order",
					key: "order_id",
				},
			},
			item_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_item",
					key: "item_id",
				},
			},
			order_item_status: {
				type: DataTypes.ENUM(
					"to_do",
					"in_making",
					"ready_to_serve",
					"served",
					"cancelled"
				),
				isIn: {
					args: [
						["to_do", "in_making", "ready_to_serve", "served", "cancelled"],
					],
					msg: "select valid order item status",
				},
				defaultValue: "to_do",
			},
			item_image: {
				type: DataTypes.STRING,
				defaultValue: null,
			},
			note: {
				type: DataTypes.STRING,
				defaultValue: null,
			},
			quantity: {
				type: DataTypes.INTEGER,
			},
			price: {
				type: DataTypes.DOUBLE,
			},
			item_name: {
				type: DataTypes.STRING,
			},
			barista_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_users",
					key: "user_id",
				},
				defaultValue: null,
			},
		},
		{
			tableName: "tbl_order_items",
			timestamps: true,
		}
	);

	return Order_Item;
};

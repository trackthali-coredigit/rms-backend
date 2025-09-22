module.exports = (sequelize, DataTypes) => {
	const Order = sequelize.define(
		"order_model",
		{
			order_id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true, // Sequelize will automatically set this as auto-increment since it's the primary key
				allowNull: false,
			},
			business_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_business",
					key: "business_id",
				},
			},
			table_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_table",
					key: "table_id",
				},
			},
			order_status: {
				// Barista order accept status in_progress
				// When customer finally order completed then completed - admin change the status to completed
				// If customer cancel the order then cancelled - admin and waiter change the status to cancelled
				type: DataTypes.ENUM("to_do", "in_progress", "complete", "cancelled"),
				isIn: {
					args: [["to_do", "in_progress", "complete", "cancelled"]],
					msg: "select valid role",
				},
				defaultValue: "to_do",
			},
			total_price: {
				type: DataTypes.DOUBLE,
				defaultValue: 0,
			},
			order_type: {
				type: DataTypes.ENUM("dine_in", "take_away", "delivery"),
				isIn: {
					args: [["dine_in", "take_away", "delivery"]],
					msg: "select valid order type",
				},
			},
			bill_status: {
				type: DataTypes.ENUM("unpaid", "paid", "void"),
				isIn: {
					args: [["unpaid", "paid", "void"]],
					msg: "select valid bill status",
				},
				defaultValue: "void",
			},
			sub_total: {
				type: DataTypes.DOUBLE,
				defaultValue: 0,
			},
			discount: {
				type: DataTypes.DOUBLE,
				defaultValue: 0,
			},
			taxes: {
				type: DataTypes.DOUBLE,
				defaultValue: 0,
			},
			extra_charges: {
				type: DataTypes.DOUBLE,
				defaultValue: 0,
			},
			payment_status: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			// Customer placing the order role is 'user'
			user_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_users",
					key: "user_id",
				},
			},
			barista_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_users",
					key: "user_id",
				},
				defaultValue: null,
			},
			waiter_id: {
				type: DataTypes.INTEGER,
				references: {
					model: "tbl_waiter",
					key: "id",
				},
				defaultValue: null,
			},
			special_guest: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			tableName: "tbl_order",
			timestamps: true,
		}
	);

	return Order;
};

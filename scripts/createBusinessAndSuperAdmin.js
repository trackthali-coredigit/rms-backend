// Script to create a default business and then a super admin user
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
require("dotenv").config();

const businessData = {
	business_id: 1,
	business_name: "Default Business",
	business_email: "business@example.com",
};

const superAdminData = {
	business_id: 1, // Will match the business created above
	email: "superadmin@example.com",
	password: "SuperSecurePassword123",
	username: "superadmin",
	role: "super_admin",
	is_verify: true,
	is_account_setup: true,
	first_name: "Super",
	last_name: "Admin",
	iso_code: "IN",
	country_code: "+91",
	phone_no: "9999999999",
};

async function createBusinessAndSuperAdmin() {
	const sequelize = new Sequelize(
		process.env.DATABASE || "restrotools",
		process.env.DBUSER || "root",
		process.env.DBPASSWORD || "",
		{
			host: process.env.DBHOST || "localhost",
			dialect: "mysql",
			logging: false,
		}
	);

	// Define Business model
	const Business = sequelize.define(
		"business_model",
		{
			business_id: { type: DataTypes.INTEGER, primaryKey: true },
			business_name: { type: DataTypes.STRING },
			business_email: { type: DataTypes.STRING },
		},
		{
			tableName: "tbl_business",
			timestamps: true,
		}
	);

	// Define User model (should match your Sequelize model)
	const User = sequelize.define(
		"users_model",
		{
			user_id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			business_id: { type: DataTypes.INTEGER },
			email: { type: DataTypes.STRING },
			password: { type: DataTypes.STRING },
			username: { type: DataTypes.STRING },
			role: {
				type: DataTypes.ENUM(
					"super_admin",
					"admin",
					"waiter",
					"barista",
					"supervisor",
					"user"
				),
			},
			is_verify: { type: DataTypes.BOOLEAN },
			is_account_setup: { type: DataTypes.BOOLEAN },
			first_name: { type: DataTypes.STRING },
			last_name: { type: DataTypes.STRING },
			iso_code: { type: DataTypes.STRING },
			country_code: { type: DataTypes.STRING },
			phone_no: { type: DataTypes.BIGINT },
			is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
		},
		{
			tableName: "tbl_users",
			timestamps: true,
		}
	);

	try {
		await sequelize.authenticate();
		console.log("DB connection established.");
		await sequelize.sync({ force: true });
		// await sequelize.sync({ alter: true }); // Uncomment if you want to auto-create tables

		// Create business if not exists
		const [business, businessCreated] = await Business.findOrCreate({
			where: { business_id: businessData.business_id },
			defaults: businessData,
		});
		if (businessCreated) {
			console.log("Business created:", business.toJSON());
		} else {
			console.log("Business already exists:", business.toJSON());
		}

		// Hash the password before storing
		const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
		const userDefaults = { ...superAdminData, password: hashedPassword };
		// Create super admin if not exists
		const [user, created] = await User.findOrCreate({
			where: { email: superAdminData.email },
			defaults: userDefaults,
		});
		if (created) {
			console.log("Super admin created:", user.toJSON());
		} else {
			console.log("Super admin already exists:", user.toJSON());
		}
	} catch (err) {
		console.error("Error creating business or super admin:", err);
	} finally {
		await sequelize.close();
	}
}

createBusinessAndSuperAdmin();

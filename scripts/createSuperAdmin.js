// Script to create a super admin user in the database
const { Sequelize, DataTypes } = require("sequelize");
// const bcrypt = require("bcryptjs");
require("dotenv").config();

// Update these values as needed
const superAdminData = {
	business_id: 1, // Set a valid business_id or null if not required
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

async function createSuperAdmin() {
	// Adjust DB connection as per your config
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

	// Define the User model inline (should match your Sequelize model)
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
		// Uncomment the next line if you want to auto-create the table (be careful with force:true)
		// await sequelize.sync({ alter: true });
		// Hash the password
		// const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
		superAdminData.password = superAdminData.password;
		// Create super admin
		const [user, created] = await User.findOrCreate({
			where: { email: superAdminData.email },
			defaults: superAdminData,
		});
		if (created) {
			console.log("Super admin created:", user.toJSON());
		} else {
			console.log("Super admin already exists:", user.toJSON());
		}
	} catch (err) {
		console.error("Error creating super admin:", err);
	} finally {
		await sequelize.close();
	}
}

createSuperAdmin();

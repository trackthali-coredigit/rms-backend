// Migration script to add public_id column to tbl_item_img table for Cloudinary support
const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// Database configuration
const sequelize = new Sequelize(
	process.env.DATABASE,
	process.env.DBUSER,
	process.env.DBPASSWORD,
	{
		host: process.env.DBHOST,
		port: process.env.DBPORT,
		dialect: "mysql",
		logging: console.log,
	}
);

async function addPublicIdColumn() {
	try {
		console.log(
			"Starting migration: Adding public_id column to tbl_item_img..."
		);

		// Check if the column already exists
		const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DATABASE}' 
      AND TABLE_NAME = 'tbl_item_img' 
      AND COLUMN_NAME = 'public_id'
    `);

		if (results.length > 0) {
			console.log("Column 'public_id' already exists in tbl_item_img table.");
			return;
		}

		// Add the public_id column
		await sequelize.query(`
      ALTER TABLE tbl_item_img 
      ADD COLUMN public_id VARCHAR(255) NULL 
      COMMENT 'Cloudinary public ID for image deletion'
    `);

		console.log("Successfully added public_id column to tbl_item_img table.");

		// Optional: Update existing records to set public_id to NULL (already default)
		console.log("Migration completed successfully!");
	} catch (error) {
		console.error("Migration failed:", error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

// Run the migration
if (require.main === module) {
	addPublicIdColumn()
		.then(() => {
			console.log("Migration script completed.");
			process.exit(0);
		})
		.catch((error) => {
			console.error("Migration script failed:", error);
			process.exit(1);
		});
}

module.exports = { addPublicIdColumn };

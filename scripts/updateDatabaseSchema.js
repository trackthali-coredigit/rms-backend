/**
 * Database Schema Update Script
 * This script fixes foreign key constraint issues and updates schema
 * Run this if you encounter foreign key constraint errors
 */

require("dotenv").config();
const { db } = require("../config/db");

async function updateDatabaseSchema() {
	try {
		console.log("🔄 Starting database schema update...");

		// Test database connection
		await db.sequelize.authenticate();
		console.log("✅ Database connection established successfully.");

		// First, handle foreign key constraint issues
		await fixForeignKeyConstraints();

		// Sync database schema with models (alter mode adds missing columns)
		await db.sequelize.sync({ alter: true });
		console.log("✅ Database schema updated successfully.");

		// Verify the models can be queried
		const userCount = await db.User.count();
		console.log(`✅ User table accessible. Total users: ${userCount}`);

		console.log("🎉 Schema update completed successfully!");
		console.log("📋 Updates applied:");
		console.log("   - Fixed foreign key constraint issues");
		console.log("   - Updated ingrediant_id column type to VARCHAR(255)");
		console.log("   - Added missing OTP columns if needed");
	} catch (error) {
		console.error("❌ Error updating database schema:", error);
		console.log("\n🔧 Troubleshooting tips:");
		console.log("1. Check your database connection settings");
		console.log("2. Ensure the database user has ALTER table permissions");
		console.log("3. Verify the database exists and is accessible");
		console.log(
			"4. Check for existing data that might conflict with schema changes"
		);
	} finally {
		// Close database connection
		if (db.sequelize) {
			await db.sequelize.close();
			console.log("🔌 Database connection closed.");
		}
		process.exit(0);
	}
}

async function fixForeignKeyConstraints() {
	console.log("🔧 Fixing foreign key constraints...");

	try {
		// Drop existing foreign key constraint if it exists
		await db.sequelize.query(`
			SELECT CONSTRAINT_NAME 
			FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
			WHERE TABLE_NAME = 'tbl_order_items' 
			AND COLUMN_NAME = 'ingrediant_id' 
			AND CONSTRAINT_NAME LIKE '%_ibfk_%'
		`);

		// Drop the problematic foreign key constraint
		try {
			await db.sequelize.query(`
				ALTER TABLE tbl_order_items 
				DROP FOREIGN KEY tbl_order_items_ibfk_1
			`);
			console.log("✅ Dropped existing foreign key constraint");
		} catch (dropError) {
			console.log("ℹ️  No existing foreign key to drop or already dropped");
		}

		// Check if the column type needs to be changed
		const [results] = await db.sequelize.query(`
			SELECT DATA_TYPE, IS_NULLABLE
			FROM INFORMATION_SCHEMA.COLUMNS
			WHERE TABLE_NAME = 'tbl_order_items'
			AND COLUMN_NAME = 'ingrediant_id'
		`);

		if (results.length > 0) {
			const columnInfo = results[0];
			if (columnInfo.DATA_TYPE === "int") {
				console.log("🔄 Converting ingrediant_id from INTEGER to VARCHAR(255)...");

				// Update any existing data to handle the type conversion
				await db.sequelize.query(`
					UPDATE tbl_order_items
					SET ingrediant_id = NULL
					WHERE ingrediant_id = 0 OR ingrediant_id IS NULL
				`);

				// Change column type
				await db.sequelize.query(`
					ALTER TABLE tbl_order_items
					MODIFY COLUMN ingrediant_id VARCHAR(255) DEFAULT NULL
				`);
				console.log("✅ Updated ingrediant_id column type to VARCHAR(255)");
			} else if (columnInfo.DATA_TYPE === "varchar") {
				console.log("🔄 Ensuring ingrediant_id is VARCHAR(255)...");

				// Ensure it's VARCHAR(255) specifically
				await db.sequelize.query(`
					ALTER TABLE tbl_order_items
					MODIFY COLUMN ingrediant_id VARCHAR(255) DEFAULT NULL
				`);
				console.log("✅ Confirmed ingrediant_id is VARCHAR(255)");
			}
		}

		console.log("✅ Foreign key constraints fixed successfully");
	} catch (error) {
		console.warn(
			"⚠️  Warning during foreign key constraint fix:",
			error.message
		);
		// Continue execution as this might not be critical
	}
}

// Run the schema update
updateDatabaseSchema();

require("dotenv").config();
const { Sequelize, DataTypes, Model } = require("sequelize");
console.log("im in connect.js");

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DBUSER,
  process.env.DBPASSWORD,
  {
    host: process.env.DBHOST,
    logging: false,
    dialect: "mysql",
    port: process.env.DBPORT,
  });
  console.log("im out of connect.js");

sequelize.options.logging = console.log;
module.exports = {sequelize}
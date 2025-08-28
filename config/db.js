const { Sequelize, DataTypes, Model } = require("sequelize");
const { sequelize } = require("./connect");
console.log("im in db.js");
var db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("../models/user")(sequelize, DataTypes, Model);
db.Token = require("../models/token")(sequelize, DataTypes, Model);
db.Business = require("../models/business")(sequelize, DataTypes, Model);
db.BusinessHours = require("../models/business_hours")(sequelize,DataTypes, Model);
db.Category = require("../models/category")(sequelize, DataTypes, Model);
db.Items = require("../models/items")(sequelize, DataTypes, Model);
db.Item_Img = require("../models/items.img")(sequelize, DataTypes, Model);
db.Ingrediant = require("../models/ingrediant")(sequelize, DataTypes, Model);
db.Tables = require("../models/table")(sequelize, DataTypes, Model);
db.Waiter = require("../models/waiter")(sequelize, DataTypes, Model);
db.Order = require("../models/order")(sequelize, DataTypes, Model);
db.Order_Item = require("../models/order.item")(sequelize, DataTypes, Model);
db.Contact_Us = require("../models/contact_us")(sequelize, DataTypes, Model);
db.PromoCode = require("../models/promo_code")(sequelize, DataTypes, Model);
db.Notification = require('../models/notification')(sequelize, DataTypes, Model);    

db.Business.hasMany(db.User, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});
db.User.belongsTo(db.Business, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});

db.Business.hasMany(db.BusinessHours, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});
db.BusinessHours.belongsTo(db.Business, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});

db.Business.hasMany(db.Category, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});
db.Category.belongsTo(db.Business, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});

db.Category.hasMany(db.Items, {
  foreignKey: "category_id",
  sourceKey: "category_id",
  targetKey: "category_id",
});
db.Items.belongsTo(db.Category, {
  foreignKey: "category_id",
  sourceKey: "category_id",
  targetKey: "category_id",
});

db.Items.hasMany(db.Item_Img, {
  foreignKey: "item_id",
  sourceKey: "item_id",
  targetKey: "item_id",
});
db.Item_Img.belongsTo(db.Items, {
  foreignKey: "item_id",
  sourceKey: "item_id",
  targetKey: "item_id",
});

db.Items.hasMany(db.Ingrediant, {
  foreignKey: "item_id",
  sourceKey: "item_id",
  targetKey: "item_id",
});
db.Ingrediant.belongsTo(db.Items, {
  foreignKey: "item_id",
  sourceKey: "item_id",
  targetKey: "item_id",
});

db.Business.hasMany(db.Tables, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});
db.Tables.belongsTo(db.Business, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});
//many to many
// db.User.belongsToMany(db.Tables, {
//   through: db.Waiter,
//   foreignKey: "user_id",
//   otherKey: "table_id",
// });
// db.Tables.belongsToMany(db.User, {
//   through: db.Waiter,
//   foreignKey: "table_id",
//   otherKey: "user_id",
// });
db.User.hasMany(db.Waiter, {
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  targetKey: 'user_id'
});

db.Waiter.belongsTo(db.User, {
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  targetKey: 'user_id'
});

db.Tables.hasMany(db.Waiter, {
  foreignKey: 'table_id',
  sourceKey: 'table_id',
  targetKey: 'table_id'
});

db.Waiter.belongsTo(db.Tables, {
  foreignKey: 'table_id',
  sourceKey: 'table_id',
  targetKey: 'table_id'
});


db.User.hasMany(db.Order, {
  foreignKey: "user_id",
  sourceKey: "user_id",
  targetKey: "user_id",
});
db.Order.belongsTo(db.User, {
  foreignKey: "user_id",
  sourceKey: "user_id",
  targetKey: "user_id",
});

db.Order.hasMany(db.Order_Item, {
  foreignKey: "order_id",
  sourceKey: "order_id",
  targetKey: "order_id",
});
db.Order_Item.belongsTo(db.Order, {
  foreignKey: "order_id",
  sourceKey: "order_id",
  targetKey: "order_id",
});

db.Business.hasMany(db.Order, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});
db.Order.belongsTo(db.Business, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});


// User has many Notifications (as sender)
db.User.hasMany(db.Notification, {
  foreignKey: "notification_from",
  sourceKey: "user_id",
  targetKey: "notification_from",
  as: "sentNotifications"
});
db.Notification.belongsTo(db.User, {
  foreignKey: "notification_from",
  sourceKey: "notification_from",
  targetKey: "user_id",
  as: "notificationSender"
});

// User has many Notifications (as receiver)
db.User.hasMany(db.Notification, {
  foreignKey: "notification_to",
  sourceKey: "user_id",
  targetKey: "notification_to",
  as: "receivedNotifications"
});
db.Notification.belongsTo(db.User, {
  foreignKey: "notification_to",
  sourceKey: "notification_to",
  targetKey: "user_id",
  as: "notificationReceiver"
});

//user has many token 
db.User.hasMany(db.Token, {
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  targetKey: 'user_id'
});

db.Token.belongsTo(db.User, {
  foreignKey: 'user_id',
  sourceKey: 'user_id',
  targetKey: 'user_id'
});

db.Business.hasMany(db.Items, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});
db.Items.belongsTo(db.Business, {
  foreignKey: "business_id",
  sourceKey: "business_id",
  targetKey: "business_id",
});

console.log("im out of db.js");

module.exports = { db };

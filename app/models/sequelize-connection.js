require("dotenv").config();

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.PG_URL,
  {
    dialect: 'postgresql',
    dialectOptions: {
      ssl:{
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

sequelize
  .authenticate()
  .then(() => {
    console.log("OK");
  })
  .catch((error) => {
    console.error(error);
  });

module.exports = sequelize;
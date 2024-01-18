const { Model, DataTypes } = require("sequelize");
const sequelize = require("./sequelize-connection");

class Tag extends Model {}

Tag.init(
  {
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      charset: 'utf8',
    }
  },
  {
    sequelize,
    tableName: "tag",
  }
);

module.exports = Tag;

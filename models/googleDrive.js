const { Sequelize, sequelize } = require("../config/config");

const Tokens = sequelize.define(
  "Tokens",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: Sequelize.STRING, allowNull: true },
    email: { type: Sequelize.STRING, allowNull: true },
    access_token: { type: Sequelize.STRING, allowNull: true },
    refresh_token: { type: Sequelize.STRING, allowNull: true },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);
module.exports = Tokens;

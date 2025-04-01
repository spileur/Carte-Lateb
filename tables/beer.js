const { DataTypes } = require('sequelize');
const sequelize = require('../app');

const Beer = sequelize.define('Beer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brasserie: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tauxAlcool: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  taille: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  arrivage: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  commentaire: {
    type: DataTypes.STRING,
    allowNull: true
  },
  badge: {
    type: DataTypes.STRING,
    allowNull: true
  },
  image: {
    type: DataTypes.BLOB,
    allowNull: true
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
    tableName: 'beers',
    freezeTableName: true
});

Beer.sync();

module.exports = Beer;

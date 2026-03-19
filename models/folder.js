const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Folder = sequelize.define('Folder', {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id'
      }
    },
    full_path: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    storage_provider: {
      type: DataTypes.ENUM('local', 'aws', 'gcp'),
      allowNull: false
    },
    createdBy: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'folders',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  // Define associations
  Folder.associate = (models) => {
    // Self-referential association for parent-child folders
    Folder.belongsTo(models.Folder, {
      as: 'parent',
      foreignKey: 'parent_id'
    });
    
    Folder.hasMany(models.Folder, {
      as: 'children',
      foreignKey: 'parent_id'
    });
    
    // Association with files
    Folder.hasMany(models.File, {
      as: 'files',
      foreignKey: 'folder_id'
    });
  };

  return Folder;
};

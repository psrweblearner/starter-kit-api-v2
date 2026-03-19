const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false
    },
    original_name: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    storage_provider: {
      type: DataTypes.ENUM('local', 'aws', 'gcp', 'azure'),
      allowNull: false,
      defaultValue: 'local'
    },
    folder_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id'
      }
    },
    folder_path: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      defaultValue: ''
    },
    reference_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'files',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  // Define associations
  File.associate = (models) => {
    // Association with folder
    File.belongsTo(models.Folder, {
      as: 'folder',
      foreignKey: 'folder_id'
    });
    
    // Association with file references
    // File.hasMany(models.FileReference, {
    //   as: 'references',
    //   foreignKey: 'file_id'
    // });
    
    // Association with file usage tracking
    // File.hasMany(models.FileUsage, {
    //   as: 'usage',
    //   foreignKey: 'file_id'
    // });
  };

  // Instance method to generate full URL based on storage provider
  File.prototype.getFullUrl = function() {
    const storageConfig = {
      local: process.env.APP_URL || 'http://localhost:3000',
      gcp: process.env.GCP_STORAGE_URL || 'https://storage.googleapis.com/your-bucket',
      aws: process.env.AWS_S3_URL || 'https://your-bucket.s3.amazonaws.com',
      azure: process.env.AZURE_STORAGE_URL || 'https://your-storage.blob.core.windows.net'
    };
    
    const baseUrl = storageConfig[this.storage_provider] || storageConfig.local;
    return `${baseUrl}${this.file_path}`;
  };

  // Instance method to check if file is used anywhere
  File.prototype.getUsageCount = async function() {
    const { FileUsage } = require('./index');
    return await FileUsage.count({
      where: { file_id: this.id }
    });
  };

  return File;
};

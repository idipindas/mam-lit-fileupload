const mongoose = require('mongoose');

const ImageStorageSchema = new mongoose.Schema({
  mayoImageId: {
    type: String,
    required: true,
    index: true
  },
  mayoImageTitle: {
    type: String,
    required: true
  },
  mayoThumbnailUrl: {
    type: String,
    required: true
  },
  mayoFullImageUrl: {
    type: String,
    required: true
  },
  mayoImageWidth: {
    type: Number
  },
  mayoImageHeight: {
    type: Number
  },
  mayoCreateDate: {
    type: String
  },
  
  d2lImageUrl: {
    type: String,
    required: true
  },
  d2lOrgUnitId: {
    type: String,
    required: true,
    index: true
  },
  d2lModuleId: {
    type: String
  },
  d2lTopicId: {
    type: String
  },
  d2lFileName: {
    type: String,
    required: true
  },
  d2lFilePath: {
    type: String,
    required: true
  },
  
  insertedBy: {
    type: String, 
    required: true
  },
  insertedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  altText: {
    type: String
  },
  isDecorative: {
    type: Boolean,
    default: false
  },
  title: {
    type: String
  },
  
  status: {
    type: String,
    enum: ['active', 'deleted', 'archived'],
    default: 'active',
    index: true
  },
  usageCount: {
    type: Number,
    default: 1
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  
  contentType: {
    type: String
  },
  fileSize: {
    type: Number
  },
  tags: [{
    type: String
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ImageStorageSchema.index({ mayoImageId: 1, d2lOrgUnitId: 1 });
ImageStorageSchema.index({ insertedBy: 1, insertedAt: -1 });
ImageStorageSchema.index({ d2lOrgUnitId: 1, status: 1 });
ImageStorageSchema.index({ mayoImageTitle: 'text', tags: 'text' });

// Pre-save middleware to update the updatedAt field
ImageStorageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
ImageStorageSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

ImageStorageSchema.methods.markAsDeleted = function() {
  this.status = 'deleted';
  return this.save();
};

// Static methods
ImageStorageSchema.statics.findByMayoId = function(mayoImageId, orgUnitId) {
  return this.findOne({ 
    mayoImageId, 
    d2lOrgUnitId: orgUnitId, 
    status: 'active' 
  });
};

ImageStorageSchema.statics.findByUser = function(userId, orgUnitId, limit = 50) {
  return this.find({ 
    insertedBy: userId, 
    d2lOrgUnitId: orgUnitId, 
    status: 'active' 
  })
  .sort({ insertedAt: -1 })
  .limit(limit);
};

ImageStorageSchema.statics.findByOrgUnit = function(orgUnitId, limit = 100) {
  return this.find({ 
    d2lOrgUnitId: orgUnitId, 
    status: 'active' 
  })
  .sort({ insertedAt: -1 })
  .limit(limit);
};

ImageStorageSchema.statics.searchImages = function(query, orgUnitId, limit = 50) {
  return this.find({
    $and: [
      { d2lOrgUnitId: orgUnitId },
      { status: 'active' },
      {
        $or: [
          { mayoImageTitle: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
          { altText: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
  .sort({ insertedAt: -1 })
  .limit(limit);
};

const ImageStorage = mongoose.model('ImageStorage', ImageStorageSchema);

module.exports = ImageStorage;

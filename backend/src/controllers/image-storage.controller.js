const ImageStorage = require('../models/image-storage.model');
const { handleError } = require('../utils/common.utils');

const getStoredImages = async (req, res) => {
  try {
    const { orgUnitId } = req.params;
    const { limit = 50, search, userId } = req.query;
    
    let images;
    
    if (search) {
      images = await ImageStorage.searchImages(search, orgUnitId, parseInt(limit));
    } else if (userId) {
      images = await ImageStorage.findByUser(userId, orgUnitId, parseInt(limit));
    } else {
      images = await ImageStorage.findByOrgUnit(orgUnitId, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: images,
      count: images.length
    });
  } catch (error) {
    console.error('[getStoredImages] ERROR:', error);
    return handleError(res, 500, `Failed to retrieve stored images: ${error.message}`);
  }
};

const getStoredImageById = async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const image = await ImageStorage.findById(imageId);
    if (!image || image.status !== 'active') {
      return handleError(res, 404, 'Image not found');
    }
    
    await image.incrementUsage();
    
    res.json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('[getStoredImageById] ERROR:', error);
    return handleError(res, 500, `Failed to retrieve image: ${error.message}`);
  }
};

const checkMayoImageExists = async (req, res) => {
  try {
    const { mayoImageId, orgUnitId } = req.params;
    
    const existingImage = await ImageStorage.findByMayoId(mayoImageId, orgUnitId);
    
    res.json({
      success: true,
      exists: !!existingImage,
      data: existingImage || null
    });
  } catch (error) {
    console.error('[checkMayoImageExists] ERROR:', error);
    return handleError(res, 500, `Failed to check image existence: ${error.message}`);
  }
};

const saveImageStorage = async (req, res) => {
  try {
    const {
      mayoImageId,
      mayoImageTitle,
      mayoThumbnailUrl,
      mayoFullImageUrl,
      mayoImageWidth,
      mayoImageHeight,
      mayoCreateDate,
      d2lImageUrl,
      d2lOrgUnitId,
      d2lModuleId,
      d2lTopicId,
      d2lFileName,
      d2lFilePath,
      insertedBy,
      altText,
      isDecorative,
      title,
      contentType,
      fileSize,
      tags
    } = req.body;

    const existingImage = await ImageStorage.findByMayoId(mayoImageId, d2lOrgUnitId);
    
    if (existingImage) {
      await existingImage.incrementUsage();
      return res.json({
        success: true,
        data: existingImage,
        message: 'Image already exists, usage count updated'
      });
    }

    const imageStorage = new ImageStorage({
      mayoImageId,
      mayoImageTitle,
      mayoThumbnailUrl,
      mayoFullImageUrl,
      mayoImageWidth,
      mayoImageHeight,
      mayoCreateDate,
      d2lImageUrl,
      d2lOrgUnitId,
      d2lModuleId,
      d2lTopicId,
      d2lFileName,
      d2lFilePath,
      insertedBy,
      altText,
      isDecorative,
      title,
      contentType,
      fileSize,
      tags: tags || []
    });

    const savedImage = await imageStorage.save();
    
    res.status(201).json({
      success: true,
      data: savedImage,
      message: 'Image storage record created successfully'
    });
  } catch (error) {
    console.error('[saveImageStorage] ERROR:', error);
    return handleError(res, 500, `Failed to save image storage: ${error.message}`);
  }
};

const updateImageStorage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const updateData = req.body;
    
    const image = await ImageStorage.findById(imageId);
    if (!image || image.status !== 'active') {
      return handleError(res, 404, 'Image not found');
    }
    
    const allowedUpdates = ['altText', 'isDecorative', 'title', 'tags', 'status'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        image[field] = updateData[field];
      }
    });
    
    const updatedImage = await image.save();
    
    res.json({
      success: true,
      data: updatedImage,
      message: 'Image storage record updated successfully'
    });
  } catch (error) {
    console.error('[updateImageStorage] ERROR:', error);
    return handleError(res, 500, `Failed to update image storage: ${error.message}`);
  }
};

const deleteImageStorage = async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const image = await ImageStorage.findById(imageId);
    if (!image) {
      return handleError(res, 404, 'Image not found');
    }
    
    await image.markAsDeleted();
    
    res.json({
      success: true,
      message: 'Image storage record deleted successfully'
    });
  } catch (error) {
    console.error('[deleteImageStorage] ERROR:', error);
    return handleError(res, 500, `Failed to delete image storage: ${error.message}`);
  }
};

const getUsageStats = async (req, res) => {
  try {
    const { orgUnitId } = req.params;
    
    const stats = await ImageStorage.aggregate([
      { $match: { d2lOrgUnitId: orgUnitId, status: 'active' } },
      {
        $group: {
          _id: null,
          totalImages: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' },
          avgUsage: { $avg: '$usageCount' },
          mostRecentInsert: { $max: '$insertedAt' },
          oldestInsert: { $min: '$insertedAt' }
        }
      }
    ]);
    
    const topImages = await ImageStorage.find({ 
      d2lOrgUnitId: orgUnitId, 
      status: 'active' 
    })
    .sort({ usageCount: -1 })
    .limit(10)
    .select('mayoImageTitle usageCount lastUsed');
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalImages: 0,
          totalUsage: 0,
          avgUsage: 0,
          mostRecentInsert: null,
          oldestInsert: null
        },
        topImages
      }
    });
  } catch (error) {
    console.error('[getUsageStats] ERROR:', error);
    return handleError(res, 500, `Failed to get usage statistics: ${error.message}`);
  }
};

module.exports = {
  getStoredImages,
  getStoredImageById,
  checkMayoImageExists,
  saveImageStorage,
  updateImageStorage,
  deleteImageStorage,
  getUsageStats
};

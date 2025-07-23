// image-upload-model.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ImageUploadSchema = new Schema({
  imageId: { type: String, required: true, unique: true },
  mayoUrl: { type: String, required: true },
  d2lImageUrl: { type: String, required: true },
  title: { type: String, required: true },
  altText: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ImageUpload", ImageUploadSchema);

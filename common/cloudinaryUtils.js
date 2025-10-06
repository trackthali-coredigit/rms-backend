const cloudinary = require("../config/cloudinaryConfig");
const fs = require("fs");

/**
 * Upload image to Cloudinary
 * @param {string|Buffer} source - Local file path or buffer from multer memory storage
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Custom public ID (optional)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = async (source, folder, publicId = null) => {
	try {
		const options = {
			folder: folder,
			resource_type: "auto",
			quality: "auto:good",
			fetch_format: "auto",
		};

		if (publicId) {
			options.public_id = publicId;
		}

		let result;

		// Handle both file path and buffer uploads
		if (Buffer.isBuffer(source)) {
			// Upload from buffer (memory storage)
			result = await new Promise((resolve, reject) => {
				cloudinary.uploader
					.upload_stream(options, (error, result) => {
						if (error) reject(error);
						else resolve(result);
					})
					.end(source);
			});
		} else {
			// Upload from file path (disk storage)
			result = await cloudinary.uploader.upload(source, options);

			// Delete the local file after successful upload
			if (fs.existsSync(source)) {
				fs.unlinkSync(source);
			}
		}

		return {
			success: true,
			url: result.secure_url,
			public_id: result.public_id,
			resource_type: result.resource_type,
			format: result.format,
		};
	} catch (error) {
		console.error("Cloudinary upload error:", error);

		// Clean up local file if it exists and upload fails
		if (typeof source === "string" && fs.existsSync(source)) {
			fs.unlinkSync(source);
		}

		throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
	}
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
	try {
		const result = await cloudinary.uploader.destroy(publicId, {
			resource_type: resourceType,
			invalidate: true, // Add this to invalidate CDN cached copies
		});

		return {
			success: result.result === "ok" || result.result === "not found",
			result: result.result,
		};
	} catch (error) {
		console.error("Cloudinary deletion error:", error);
		throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
	}
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of file objects with buffer or path and originalname
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleToCloudinary = async (files, folder) => {
	try {
		const uploadPromises = files.map(async (file) => {
			const ext = file.originalname.split(".").pop().toLowerCase();
			const uniqueId = `${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`;
			const publicId = `${uniqueId}.${ext}`;

			// Use buffer if available (memory storage), otherwise use path (disk storage)
			const source = file.buffer || file.path;

			return uploadToCloudinary(source, folder, publicId);
		});

		const results = await Promise.all(uploadPromises);
		return results;
	} catch (error) {
		console.error("Multiple upload error:", error);
		throw error;
	}
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @returns {string} Public ID
 */
const extractPublicIdFromUrl = (cloudinaryUrl) => {
	try {
		if (!cloudinaryUrl || typeof cloudinaryUrl !== "string") {
			return null;
		}

		// Handle both secure_url and url formats
		const urlParts = cloudinaryUrl.split("/");
		const resourceIndex = urlParts.findIndex(
			(part) => part === "image" || part === "video" || part === "raw"
		);

		if (resourceIndex === -1) {
			return null;
		}

		// Get everything after upload/version/
		const pathAfterUpload = urlParts.slice(resourceIndex + 2).join("/");

		// Remove file extension
		const publicId = pathAfterUpload.replace(/\.[^/.]+$/, "");

		return publicId;
	} catch (error) {
		console.error("Error extracting public ID:", error);
		return null;
	}
};

/**
 * Validate image file
 * @param {Object} file - File object from multer (can have buffer or path)
 * @param {Array} allowedExtensions - Array of allowed extensions
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} Validation result
 */
const validateImageFile = (
	file,
	allowedExtensions = ["jpg", "jpeg", "png"],
	maxSize = 4 * 1024 * 1024
) => {
	const ext = file.originalname.split(".").pop().toLowerCase();

	if (!allowedExtensions.includes(ext)) {
		return {
			isValid: false,
			error: `Invalid file type. Only ${allowedExtensions.join(
				", "
			)} are allowed`,
		};
	}

	// Check size from buffer or file size property
	const fileSize = file.buffer ? file.buffer.length : file.size;

	if (fileSize > maxSize) {
		return {
			isValid: false,
			error: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
		};
	}

	return {
		isValid: true,
		error: null,
	};
};

/**
 * Validate multiple image files
 * @param {Array} files - Array of file objects
 * @param {Array} allowedExtensions - Array of allowed extensions
 * @param {number} maxSize - Maximum file size in bytes
 * @param {number} maxCount - Maximum number of files
 * @returns {Object} Validation result
 */
const validateMultipleImageFiles = (
	files,
	allowedExtensions = ["jpg", "jpeg", "png"],
	maxSize = 4 * 1024 * 1024,
	maxCount = 10
) => {
	if (!files || files.length === 0) {
		return {
			isValid: false,
			error: "No files provided",
		};
	}

	if (files.length > maxCount) {
		return {
			isValid: false,
			error: `Maximum ${maxCount} files allowed`,
		};
	}

	for (const file of files) {
		const validation = validateImageFile(file, allowedExtensions, maxSize);
		if (!validation.isValid) {
			return validation;
		}
	}

	return {
		isValid: true,
		error: null,
	};
};

module.exports = {
	uploadToCloudinary,
	deleteFromCloudinary,
	uploadMultipleToCloudinary,
	extractPublicIdFromUrl,
	validateImageFile,
	validateMultipleImageFiles,
};

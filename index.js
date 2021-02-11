const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const {Storage} = require('@google-cloud/storage');

exports.generateThumbnail = async (data, context) => {
    const file = data;
    const storage = new Storage();
    const sourceBucket = storage.bucket(file.bucket);
    const thumbnailBucket = storage.bucket('cit-412-garogden-thumbs');

    // Create a working directory
    const workingDir = path.join(os.tmpdir(), 'thumbs_temp');

    // Create a temporary file path for the file we are working with
    const tmpFilePath = path.join(workingDir, file.name);

    // Wait until the temp directory is ready
    await fs.ensureDir(workingDir);

    // Download the uploaded file to the temp directory
    await sourceBucket.file(file.name).download({
        destination: tmpFilePath
    });

    // Add an array of all of the thumbnail sizes we want to create
    const sizes = [64, 256];

    // Declare a function that will loop through the array and create a thumbnail for each size in the array

    const makeThumbnails = sizes.map(async size => {
                const thumbName = `thumb@${size}_${file.name}`;

                const thumbPath = path.join(workingDir, thumbName);

                await sharp(tmpFilePath).resize(size).toFile(thumbPath);

                return thumbnailBucket.upload(thumbPath, {});

    });
    // Call the makeThumbnails function
    await Promise.all(makeThumbnails);

    // Delete our temp working directory
    await fs.remove(workingDir);

    return true;



};

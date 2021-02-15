// const sharp = require('sharp');
// const path = require('path');
// const fs = require('fs-extra');
// const os = require('os');
// const {Storage} = require('@google-cloud/storage');

// exports.generateThumbnail = async (data, context) => {
//     const file = data;
//     const storage = new Storage();
//     const sourceBucket = storage.bucket(file.bucket);
//     const thumbnailBucket = storage.bucket('cit-412-garogden-thumbs');
//     const finalImages = storage.bucket('cit-412-garogden-final-images');
//     // Create a working directory
//     const workingDir = path.join(os.tmpdir(), 'thumbs_temp');

//     // Create a temporary file path for the file we are working with
//     const tmpFilePath = path.join(workingDir, file.name);


//     //1. Checking the content type being uploaded
//     var fileExtension = "";
//     if (file.contentType == "image/jpeg"){
//         fileExtension = "jpg";
//     } else if (file.contentType == "image/png"){
//         fileExtension = "png";
//     } else {
//         await sourceBucket.file(file.name).delete(function(err, apiResponse) { });
//         return false;
//     };

//     //2. Downloading original files to final-images bucket
//     await sourceBucket.file(file.name).download({
//         destination: finalImages
//     });

//     //3. Deleting files uploaded to source bucket
//     await fs.remove(file);

//     return true;

//     // Wait until the temp directory is ready
//     await fs.ensureDir(workingDir);

//     // Download the uploaded file to the temp directory
//     await sourceBucket.file(file.name).download({
//         destination: tmpFilePath
//     });

//     // Add an array of all of the thumbnail sizes we want to create
//     const sizes = [64, 256];

//     // Declare a function that will loop through the array and create a thumbnail for each size in the array

//     const makeThumbnails = sizes.map(async size => {
//                 const thumbName = `thumb@${size}_${file.name}`;

//                 const thumbPath = path.join(workingDir, thumbName);

//                 await sharp(tmpFilePath).resize(size).toFile(thumbPath);

//                 return thumbnailBucket.upload(thumbPath, {});

//     });
//     // Call the makeThumbnails function
//     await Promise.all(makeThumbnails);

//     // Delete our temp working directory
//     await fs.remove(workingDir);

//     return true;



// };

const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const {Storage} = require('@google-cloud/storage');

exports.generateThumbnail = async(data, context) => {
    const file = data;
    const storage = new Storage();
    const sourceBucket = storage.bucket(file.bucket);
    const thumbnailBucket = storage.bucket('cit-412-garogden-thumbs');

    //create working directory
    const workingDirectory = path.join(os.tmpdir(), 'thumbs-temp');

    //create temporary filepath
    const tmpFilePath = path.join(workingDirectory, file.name);

    //Wait until the directory is ready
    await fs.ensureDir(workingDirectory);

    //Download the uploaded file into the temp directory
    await sourceBucket.file(file.name).download({
        destination: tmpFilePath
    });

    //Add an array based on sizes

    const sizes = [64, 256];

    //loops through and creates images based on size
    const makeThumbnails = sizes.map(async size => {
        const thumbname = `thumb@${size}_${file.name}`;
        const thumbpath = path.join(workingDirectory, thumbname);
        await sharp(tmpFilePath).resize(size).toFile(thumbpath);
        return thumbnailBucket.upload(thumbpath, {});
    });

    await Promise.all(makeThumbnails);

    await fs.remove(workingDirectory);

    return true;
};
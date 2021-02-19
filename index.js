const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const os= require('os');
const {Storage} = require('@google-cloud/storage');

exports.generateThumbnail= async (data, context) => {

    const file = data;
    const storage = new Storage();
    const sourceBucket= storage.bucket(file.bucket);
    const thumbnailBucket= storage.bucket('cit-412-garogden-thumbs');

    const num = file.generation;
    
    const srcBucket = 'cit-412-garogden-source-images';
    const finalBucket = 'cit-412-garogden-final-images';
    const fileName = `final_${file.name}_#${num}`;


    async function getMetadata() {
    // Gets the metadata for the file
    const [metadata] = await storage
        .bucket(srcBucket)
        .file(file.name)
        .getMetadata();

        if(metadata.contentType === 'image/jpeg' || metadata.contentType === 'image/png'){
        
            // Create a working directory
            const workingDir= path.join(os.tmpdir(), 'thumbs_temp');
            
            // Create a temporary file path for the file we are working with
            const tmpFilePath= path.join(workingDir, file.name);

            // Wait until the temp directory is ready
            await fs.ensureDir(workingDir);

            // Download the uploaded file to the temp directory
            await sourceBucket.file(file.name).download({
                destination: tmpFilePath
            });

            // Copy Src File to Final Bucket
            async function copyFile() {
                // Copies the file to the other bucket
                await storage
                    .bucket(srcBucket)
                    .file(file.name)
                    .copy(storage.bucket(finalBucket).file(fileName));

            };

            // Add an array of all of the thumbnail sizes we want to create
            const sizes = [64, 256];

            // Declare a function that will loop through the array and create a thumbnail for each size in the array
            const makeThumbnails= sizes.map(async size => {

                const thumbName= `thumb@${size}_${file.name}_#${num}`;
                const thumbPath= path.join(workingDir, thumbName);
                await sharp(tmpFilePath).resize(size).toFile(thumbPath);
                return thumbnailBucket.upload(thumbPath, {})
            });

            // Call the makeThumbnailsfunction
            copyFile();
            await Promise.all(makeThumbnails);

            // Delete our temp working directory
            await fs.remove(workingDir);

            // Delete From Source Img Bucket
            await sourceBucket.file(file.name).delete({
            });
            
            return true;
            
        }else {

            // Delete From Source Img Bucket
            await sourceBucket.file(file.name).delete({
            });
            
            return false; 
        }
    };

    getMetadata();

}; // End of generateThumbnails function
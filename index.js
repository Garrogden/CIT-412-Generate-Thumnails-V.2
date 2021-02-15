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
    const generationnumb = file.generation;

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
        const thumbname = `thumb@${size}_${file.name}_${generationnumb}`;
        const thumbpath = path.join(workingDirectory, thumbname);
        await sharp(tmpFilePath).resize(size).toFile(thumbpath);
        return thumbnailBucket.upload(thumbpath, {});
    });

    await Promise.all(makeThumbnails);

    await fs.remove(workingDirectory);

    return true;

    //1. Checking the content type being uploaded
    const filterSource = async(file) => {
        if (file.contentType !== 'image/jpeg' && file.contentType !== 'image/png'){
            //if file is not jpeg or png, delete from bucket
             return deleteFile(file).catch(console.error)
;
        }
    }

    //2. Downloading original files to final-images bucket
    await sourceBucket.file(file.name).copy({
        destination: finalImages
    });

    //3. Deleting files uploaded to source bucket
    await fs.remove(file);

    return true;
};
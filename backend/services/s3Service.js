const { s3, bucketName } = require('../config/aws');

class S3Service {
    // Upload a file to S3
    static async uploadFile(file, key) {
        const params = {
            Bucket: bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'private' // Make the file private
        };

        try {
            const result = await s3.upload(params).promise();
            return result.Location;
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    // Generate a signed URL for video streaming
    static async getSignedUrl(key, expiresIn = 3600) {
        const params = {
            Bucket: bucketName,
            Key: key,
            Expires: expiresIn
        };

        try {
            const signedUrl = await s3.getSignedUrlPromise('getObject', params);
            return signedUrl;
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Failed to generate signed URL');
        }
    }

    // Delete a file from S3
    static async deleteFile(key) {
        const params = {
            Bucket: bucketName,
            Key: key
        };

        try {
            await s3.deleteObject(params).promise();
            return true;
        } catch (error) {
            console.error('Error deleting from S3:', error);
            throw new Error('Failed to delete file from S3');
        }
    }
}

module.exports = S3Service; 
import AWS from 'aws-sdk';
import { S3 } from 'aws-sdk';
import { Readable } from 'stream';

export class S3Service {
    private static s3 = new AWS.S3({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
    });

    private static bucket = process.env.AWS_S3_BUCKET!;

    static async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
        const params = {
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            CacheControl: 'max-age=31536000',
            Metadata: {
                'Access-Control-Allow-Origin': '*'
            }
        };

        try {
            const result = await this.s3.upload(params).promise();
            return result.Location;
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    static async deleteFile(key: string): Promise<void> {
        const params = {
            Bucket: this.bucket,
            Key: key,
        };

        await this.s3.deleteObject(params).promise();
    }

    static async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
        const params = {
            Bucket: this.bucket,
            Key: key,
            Expires: expiresIn,
            ResponseContentDisposition: 'inline',
            ResponseContentType: 'video/mp4'
        };

        try {
            const signedUrl = await this.s3.getSignedUrlPromise('getObject', params);
            return signedUrl;
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Failed to generate signed URL');
        }
    }

    static async streamFile(res: any, key: string, rangeHeader?: string): Promise<void> {
        // Get the file size from S3
        const headParams = {
            Bucket: this.bucket,
            Key: key,
        };
        let fileSize: number;
        try {
            const headData = await this.s3.headObject(headParams).promise();
            fileSize = headData.ContentLength || 0;
        } catch (error) {
            console.error('Error getting S3 object head:', error);
            res.status(404).json({ message: 'Video file not found in S3' });
            return;
        }

        let start = 0;
        let end = fileSize - 1;
        let status = 200;
        const headers: any = {
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD',
            'Access-Control-Allow-Headers': 'Range',
            'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Content-Type'
        };

        if (rangeHeader) {
            const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
            if (match) {
                start = parseInt(match[1], 10);
                end = match[2] ? parseInt(match[2], 10) : end;
                status = 206;
                headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
                headers['Content-Length'] = end - start + 1;
            }
        } else {
            headers['Content-Length'] = fileSize;
        }

        const streamParams = {
            Bucket: this.bucket,
            Key: key,
            Range: `bytes=${start}-${end}`,
        };

        try {
            const s3Stream = this.s3.getObject(streamParams).createReadStream();
            res.writeHead(status, headers);
            s3Stream.pipe(res);
        } catch (error) {
            console.error('Error streaming from S3:', error);
            res.status(500).json({ message: 'Error streaming video from S3' });
        }
    }
} 
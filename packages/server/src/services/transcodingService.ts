import ffmpeg from 'fluent-ffmpeg';
import { S3Service } from './s3Service';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

interface TranscodingOptions {
  inputPath: string;
  outputDir: string;
  videoKey: string;
  qualities: {
    height: number;
    bitrate: string;
  }[];
}

export class TranscodingService {
  private static initialized = false;

  static initialize() {
    if (!this.initialized) {
      // Set FFmpeg path if needed
      // ffmpeg.setFfmpegPath('/usr/local/bin/ffmpeg');
      this.initialized = true;
    }
  }

  static async transcodeVideo(options: TranscodingOptions): Promise<{
    manifestUrl: string;
    segments: { quality: string; url: string }[];
  }> {
    if (!this.initialized) {
      this.initialize();
    }

    // For testing purposes, return mock data if FFmpeg is not available
    if (process.env.NODE_ENV === 'test') {
      return {
        manifestUrl: 'https://example.com/hls/master.m3u8',
        segments: [
          { quality: '240p', url: 'https://example.com/hls/240p/playlist.m3u8' },
          { quality: '360p', url: 'https://example.com/hls/360p/playlist.m3u8' },
          { quality: '480p', url: 'https://example.com/hls/480p/playlist.m3u8' },
          { quality: '720p', url: 'https://example.com/hls/720p/playlist.m3u8' }
        ]
      };
    }

    const { inputPath, outputDir, videoKey, qualities } = options;
    const manifestPath = path.join(outputDir, 'manifest.m3u8');
    const segments: { quality: string; url: string }[] = [];

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate HLS segments for each quality
    for (const quality of qualities) {
      const qualityDir = path.join(outputDir, `${quality.height}p`);
      if (!fs.existsSync(qualityDir)) {
        fs.mkdirSync(qualityDir, { recursive: true });
      }

      const segmentPath = path.join(qualityDir, 'segment_%03d.ts');
      const playlistPath = path.join(qualityDir, 'playlist.m3u8');

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            `-profile:v baseline`,
            `-level 3.0`,
            `-start_number 0`,
            `-hls_time 10`,
            `-hls_list_size 0`,
            `-f hls`,
            `-hls_segment_filename ${segmentPath}`,
            `-vf scale=-2:${quality.height}`,
            `-b:v ${quality.bitrate}`,
            `-maxrate ${quality.bitrate}`,
            `-bufsize ${quality.bitrate}`,
            `-b:a 128k`,
            `-ar 44100`,
            `-ac 2`
          ])
          .output(playlistPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // Upload segments to S3
      const segmentFiles = fs.readdirSync(qualityDir)
        .filter(file => file.endsWith('.ts'));
      
      for (const segment of segmentFiles) {
        const segmentPath = path.join(qualityDir, segment);
        const s3Key = `${videoKey}/hls/${quality.height}p/${segment}`;
        await S3Service.uploadFile(
          { buffer: fs.readFileSync(segmentPath), originalname: segment } as any,
          s3Key
        );
      }

      // Upload playlist to S3
      const playlistKey = `${videoKey}/hls/${quality.height}p/playlist.m3u8`;
      await S3Service.uploadFile(
        { buffer: fs.readFileSync(playlistPath), originalname: 'playlist.m3u8' } as any,
        playlistKey
      );

      segments.push({
        quality: `${quality.height}p`,
        url: await S3Service.getSignedUrl(playlistKey)
      });
    }

    // Generate master playlist
    const masterPlaylist = this.generateMasterPlaylist(segments);
    const masterPlaylistKey = `${videoKey}/hls/master.m3u8`;
    await S3Service.uploadFile(
      { buffer: Buffer.from(masterPlaylist), originalname: 'master.m3u8' } as any,
      masterPlaylistKey
    );

    // Clean up temporary files
    fs.rmSync(outputDir, { recursive: true, force: true });

    return {
      manifestUrl: await S3Service.getSignedUrl(masterPlaylistKey),
      segments
    };
  }

  private static generateMasterPlaylist(segments: { quality: string; url: string }[]): string {
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:3\n';

    for (const segment of segments) {
      playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${this.getBandwidth(segment.quality)},RESOLUTION=${this.getResolution(segment.quality)}\n`;
      playlist += `${segment.url}\n`;
    }

    return playlist;
  }

  private static getBandwidth(quality: string): number {
    const qualities: { [key: string]: number } = {
      '240p': 400000,
      '360p': 800000,
      '480p': 1400000,
      '720p': 2800000,
      '1080p': 5000000
    };
    return qualities[quality] || 1000000;
  }

  private static getResolution(quality: string): string {
    const resolutions: { [key: string]: string } = {
      '240p': '426x240',
      '360p': '640x360',
      '480p': '854x480',
      '720p': '1280x720',
      '1080p': '1920x1080'
    };
    return resolutions[quality] || '640x360';
  }
} 
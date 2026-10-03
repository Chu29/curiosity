import { Injectable } from '@nestjs/common';
import { CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider, StorageUploadInput, StorageUploadResult } from './storage-provider.interface';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly bucket = process.env.STORAGE_BUCKET ?? '';
  private readonly endpoint = process.env.STORAGE_ENDPOINT;
  private readonly autoCreateBucket = process.env.STORAGE_AUTO_CREATE_BUCKET === 'true';
  private readonly client = new S3Client({
    region: process.env.STORAGE_REGION || 'auto',
    endpoint: this.endpoint || undefined,
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: process.env.STORAGE_SECRET_KEY ?? '',
    },
  });

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    await this.ensureBucket();
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }));

    return {
      storageKey: input.key,
      mediaUrl: await this.getSignedUrl(input.key),
    };
  }

  private async ensureBucket(): Promise<void> {
    if (!this.autoCreateBucket) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch {
      // Local S3-compatible services start with no buckets. Creating the
      // configured bucket here keeps the first upload self-contained while
      // remaining safe when the bucket already exists.
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (error) {
        const name = error instanceof Error ? error.name : '';
        if (name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') throw error;
      }
    }
  }

  getSignedUrl(storageKey: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      { expiresIn: 3600 },
    );
  }
}

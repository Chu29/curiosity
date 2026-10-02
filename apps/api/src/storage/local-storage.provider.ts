import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { StorageProvider, StorageUploadInput, StorageUploadResult } from './storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly root = resolve(process.env.STORAGE_LOCAL_PATH || '.local-storage');

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    if (input.key.includes('..') || input.key.startsWith('/') || input.key.includes('\\')) {
      throw new Error('Invalid local storage key');
    }

    const filePath = join(this.root, input.key);
    await mkdir(resolve(filePath, '..'), { recursive: true });
    await writeFile(filePath, input.body, { flag: 'wx' });

    return {
      storageKey: input.key,
      mediaUrl: `local://${input.key}`,
    };
  }

  async getSignedUrl(storageKey: string): Promise<string> {
    return `local://${storageKey}`;
  }
}

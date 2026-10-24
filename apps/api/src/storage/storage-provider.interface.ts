export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StorageUploadInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StorageUploadResult {
  storageKey: string;
  mediaUrl: string;
}

export interface StorageProvider {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  getSignedUrl(storageKey: string): Promise<string>;
}

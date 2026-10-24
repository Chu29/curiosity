import { Module } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage-provider.interface';
import { S3StorageProvider } from './s3-storage.provider';
import { LocalStorageProvider } from './local-storage.provider';

@Module({
  providers: [
    S3StorageProvider,
    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (s3: S3StorageProvider, local: LocalStorageProvider) =>
        process.env.STORAGE_PROVIDER === 'local' ? local : s3,
      inject: [S3StorageProvider, LocalStorageProvider],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}

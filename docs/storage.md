# Object storage configuration

The API uses the AWS S3 client behind `StorageProvider`, so Cloudflare R2 can
be used without changing presentation upload code.

## Local development

To test recording uploads without Docker or MinIO, use the filesystem provider:

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=.local-storage
```

Recordings are kept outside the web app in the private `.local-storage`
directory. The presentation API and upload flow are identical to production.

For production, create the private R2 bucket and an R2 API token in Cloudflare,
then configure the deployment with:

```env
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_FORCE_PATH_STYLE=false
STORAGE_AUTO_CREATE_BUCKET=false
STORAGE_BUCKET=curiosity-presentations
STORAGE_ACCESS_KEY=<r2-access-key-id>
STORAGE_SECRET_KEY=<r2-secret-access-key>
```

`STORAGE_AUTO_CREATE_BUCKET` remains disabled in production because the runtime
token only needs access to the pre-created private bucket. It can be enabled
for a local S3-compatible service that starts without a bucket.

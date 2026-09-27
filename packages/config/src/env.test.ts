import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from './env';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'development',
    PORT: '3001',
    POSTGRES_PORT: '5434',
    REDIS_PORT: '6379',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5434/curiosity_dev?schema=public',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'test_jwt_access_secret_longer_than_16_chars',
    JWT_REFRESH_SECRET: 'test_jwt_refresh_secret_longer_than_16_chars',
    LLM_API_KEY: 'mock-llm-key',
    EMBEDDING_API_KEY: 'mock-embedding-key',
    TRANSCRIPTION_API_KEY: 'mock-transcription-key',
    STORAGE_BUCKET: 'curiosity-uploads',
    STORAGE_ACCESS_KEY: 'minioadmin',
    STORAGE_SECRET_KEY: 'minioadmin',
  };

  it('validates a complete, correct environment config successfully', () => {
    const config = validateEnv(validEnv);
    assert.equal(config.PORT, 3001);
    assert.equal(config.NODE_ENV, 'development');
    assert.equal(config.DATABASE_URL, validEnv.DATABASE_URL);
  });

  it('throws an error with clear details when required variables are missing', () => {
    const invalidEnv = { ...validEnv };
    delete (invalidEnv as Record<string, unknown>).DATABASE_URL;
    delete (invalidEnv as Record<string, unknown>).JWT_ACCESS_SECRET;

    assert.throws(
      () => validateEnv(invalidEnv),
      (err: Error) => {
        assert.match(err.message, /\[Config Error\] Invalid or missing required environment variables/);
        assert.match(err.message, /DATABASE_URL: DATABASE_URL is required/);
        assert.match(err.message, /JWT_ACCESS_SECRET/);
        return true;
      },
    );
  });

  it('throws an error when JWT secrets are too short', () => {
    const invalidEnv = { ...validEnv, JWT_ACCESS_SECRET: 'short' };

    assert.throws(
      () => validateEnv(invalidEnv),
      (err: Error) => {
        assert.match(err.message, /JWT_ACCESS_SECRET must be at least 16 characters long/);
        return true;
      },
    );
  });
});

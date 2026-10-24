import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PresentationStatus, SessionStatus } from '@prisma/client';
import { PresentationsService } from './presentations.service';

const session = { id: 'session-1', userId: 'user-1', status: SessionStatus.PRESENTING } as any;
const presentation = { id: 'presentation-1', learningSessionId: session.id, status: PresentationStatus.RECORDING, storageKey: null, learningSession: session } as any;

function setup() {
  let current = presentation;
  const repository = {
    findById: async () => current,
    updateStatus: async (_id: string, status: PresentationStatus) => (current = { ...current, status }),
    markUploaded: async (_id: string, data: any) => (current = { ...current, ...data, status: PresentationStatus.RECORDING }),
    submit: async (_id: string, submittedAt: Date) => (current = { ...current, status: PresentationStatus.SUBMITTED, submittedAt }),
  } as any;
  const sessions = { verifySessionOwnership: async () => undefined } as any;
  let uploadCalls = 0;
  const storage = { upload: async () => { uploadCalls += 1; return { storageKey: 'stored/key', mediaUrl: 'signed-url' }; }, get uploadCalls() { return uploadCalls; } } as any;
  return { service: new PresentationsService(repository, sessions, storage), repository, storage };
}

test('rejects empty and unsupported uploads before storage', async () => {
  const { service, storage } = setup();
  await assert.rejects(() => service.upload('presentation-1', { buffer: Buffer.alloc(0), mimetype: 'audio/webm', size: 0 }, { userId: 'user-1' }), BadRequestException);
  await assert.rejects(() => service.upload('presentation-1', { buffer: Buffer.from('x'), mimetype: 'video/mp4', size: 1 }, { userId: 'user-1' }), BadRequestException);
  assert.equal(storage.uploadCalls, 0);
});

test('uploads permitted audio and submits only after media exists', async () => {
  const { service } = setup();
  const uploaded = await service.upload('presentation-1', { buffer: Buffer.from('audio'), mimetype: 'audio/webm', size: 5 }, { userId: 'user-1' });
  assert.equal(uploaded.storageKey, 'stored/key');
  const submitted = await service.submit('presentation-1', { userId: 'user-1' });
  assert.equal(submitted.status, PresentationStatus.SUBMITTED);
});

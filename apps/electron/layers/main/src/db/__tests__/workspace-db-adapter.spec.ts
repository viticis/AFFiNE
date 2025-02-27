import path from 'node:path';

import fs from 'fs-extra';
import { v4 } from 'uuid';
import { afterEach, expect, test, vi } from 'vitest';
import * as Y from 'yjs';

import type { AppContext } from '../../context';
import { dbSubjects } from '../subjects';

const tmpDir = path.join(__dirname, 'tmp');

const testAppContext: AppContext = {
  appDataPath: path.join(tmpDir, 'test-data'),
  appName: 'test',
};

afterEach(async () => {
  if (process.platform !== 'win32') {
    // hmmm ....
    await fs.remove(tmpDir);
  }
});

function getTestUpdates() {
  const testYDoc = new Y.Doc();
  const yText = testYDoc.getText('test');
  yText.insert(0, 'hello');
  const updates = Y.encodeStateAsUpdate(testYDoc);

  return updates;
}
test('can create new db file if not exists', async () => {
  const { openWorkspaceDatabase } = await import('../workspace-db-adapter');
  const workspaceId = v4();
  const db = await openWorkspaceDatabase(testAppContext, workspaceId);
  const dbPath = path.join(
    testAppContext.appDataPath,
    `workspaces/${workspaceId}`,
    `storage.db`
  );
  expect(await fs.exists(dbPath)).toBe(true);
  db.destroy();
});

test('on applyUpdate (from self), will not trigger update', async () => {
  const { openWorkspaceDatabase } = await import('../workspace-db-adapter');
  const workspaceId = v4();
  const onUpdate = vi.fn();

  const db = await openWorkspaceDatabase(testAppContext, workspaceId);
  db.update$.subscribe(onUpdate);
  db.applyUpdate(getTestUpdates(), 'self');
  expect(onUpdate).not.toHaveBeenCalled();
  db.destroy();
});

test('on applyUpdate (from renderer), will trigger update', async () => {
  const { openWorkspaceDatabase } = await import('../workspace-db-adapter');
  const workspaceId = v4();
  const onUpdate = vi.fn();
  const onExternalUpdate = vi.fn();

  const db = await openWorkspaceDatabase(testAppContext, workspaceId);
  db.update$.subscribe(onUpdate);
  const sub = dbSubjects.externalUpdate.subscribe(onExternalUpdate);
  db.applyUpdate(getTestUpdates(), 'renderer');
  expect(onUpdate).toHaveBeenCalled(); // not yet updated
  sub.unsubscribe();
  db.destroy();
});

test('on applyUpdate (from external), will trigger update & send external update event', async () => {
  const { openWorkspaceDatabase } = await import('../workspace-db-adapter');
  const workspaceId = v4();
  const onUpdate = vi.fn();
  const onExternalUpdate = vi.fn();

  const db = await openWorkspaceDatabase(testAppContext, workspaceId);
  db.update$.subscribe(onUpdate);
  const sub = dbSubjects.externalUpdate.subscribe(onExternalUpdate);
  db.applyUpdate(getTestUpdates(), 'external');
  expect(onUpdate).toHaveBeenCalled();
  expect(onExternalUpdate).toHaveBeenCalled();
  sub.unsubscribe();
  db.destroy();
});

test('on destroy, check if resources have been released', async () => {
  const { openWorkspaceDatabase } = await import('../workspace-db-adapter');
  const workspaceId = v4();
  const db = await openWorkspaceDatabase(testAppContext, workspaceId);
  const updateSub = {
    complete: vi.fn(),
    next: vi.fn(),
  };
  db.update$ = updateSub as any;
  db.destroy();
  expect(db.db).toBe(null);
  expect(updateSub.complete).toHaveBeenCalled();
});

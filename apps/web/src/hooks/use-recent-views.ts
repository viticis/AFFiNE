import type { Page, Workspace } from '@blocksuite/store';
import { useBlockSuitePageMeta } from '@toeverything/hooks/use-block-suite-page-meta';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import type { NextRouter } from 'next/router';
import { useEffect } from 'react';

import {
  workspacePreferredModeAtom,
  workspaceRecentViewsAtom,
  workspaceRecentViresWriteAtom,
} from '../atoms';
import { useCurrentWorkspace } from './current/use-current-workspace';

export const useWorkspacePreferredMode = () => {
  const [record, setPreferred] = useAtom(workspacePreferredModeAtom);
  return {
    getPreferredMode: (pageId: Page['id']) => record[pageId] ?? 'page',
    setPreferredMode: (pageId: Page['id'], mode: 'page' | 'edgeless') => {
      setPreferred(record => ({
        ...record,
        [pageId]: mode,
      }));
    },
  };
};

export function useRecentlyViewed() {
  const [workspace] = useCurrentWorkspace();
  const workspaceId = workspace?.id || null;
  const recentlyViewed = useAtomValue(workspaceRecentViewsAtom);

  if (!workspaceId) return [];
  return recentlyViewed[workspaceId] ?? [];
}

export function useSyncRecentViewsWithRouter(
  router: NextRouter,
  blockSuiteWorkspace: Workspace
) {
  const workspaceId = blockSuiteWorkspace.id;
  const pageId = router.query.pageId;
  const set = useSetAtom(workspaceRecentViresWriteAtom);
  const meta = useBlockSuitePageMeta(blockSuiteWorkspace).find(
    meta => meta.id === pageId
  );
  const { getPreferredMode } = useWorkspacePreferredMode();

  const currentMode =
    typeof pageId === 'string' ? getPreferredMode(pageId) : 'page';
  useEffect(() => {
    if (!workspaceId) return;
    if (pageId && meta) {
      set(workspaceId, {
        id: pageId as string,
        /**
         * @deprecated No necessary update `mode` at here, use `mode` from {@link useWorkspacePreferredMode} directly.
         */
        mode: currentMode,
      });
    }
  }, [pageId, meta, workspaceId, set, currentMode]);
}

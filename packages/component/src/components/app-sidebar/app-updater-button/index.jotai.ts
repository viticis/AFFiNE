import { env } from '@affine/env/config';
import { atomWithObservable, atomWithStorage } from 'jotai/utils';
import { Observable } from 'rxjs';

// todo: move to utils?
function rpcToObservable<
  T,
  H extends () => Promise<T>,
  E extends (callback: (t: T) => void) => () => void
>(
  initialValue: T,
  {
    event,
    handler,
    onSubscribe,
  }: {
    event?: E;
    handler?: H;
    onSubscribe?: () => void;
  }
) {
  return new Observable<T>(subscriber => {
    subscriber.next(initialValue);
    onSubscribe?.();
    if (typeof window === 'undefined' || !env.isDesktop || !event) {
      subscriber.complete();
      return () => {};
    }
    handler?.().then(t => {
      subscriber.next(t);
    });
    return event(t => {
      subscriber.next(t);
    });
  });
}

type InferTFromEvent<E> = E extends (
  callback: (t: infer T) => void
) => () => void
  ? T
  : never;

type UpdateMeta = InferTFromEvent<typeof window.events.updater.onUpdateReady>;

export const updateReadyAtom = atomWithObservable(() => {
  return rpcToObservable(null as UpdateMeta | null, {
    event: window.events?.updater.onUpdateReady,
  });
});

export const updateAvailableAtom = atomWithObservable(() => {
  return rpcToObservable(null as UpdateMeta | null, {
    event: window.events?.updater.onUpdateAvailable,
    onSubscribe: () => {
      window.apis?.updater.checkForUpdatesAndNotify();
    },
  });
});

export const downloadProgressAtom = atomWithObservable<number>(() => {
  return rpcToObservable(0, {
    event: window.events?.updater.onDownloadProgress,
  });
});

export const changelogCheckedAtom = atomWithStorage<Record<string, boolean>>(
  'affine:client-changelog-checked',
  {}
);

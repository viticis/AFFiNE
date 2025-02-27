import { env } from '@affine/env';
import createCache from '@emotion/cache';

const isBrowser = env.isBrowser;

export default function createEmotionCache() {
  let insertionPoint;

  if (isBrowser) {
    const emotionInsertionPoint = document.querySelector<HTMLMetaElement>(
      'meta[name="emotion-insertion-point"]'
    );
    insertionPoint = emotionInsertionPoint ?? undefined;
  }

  return createCache({ key: 'affine', insertionPoint });
}

// Web Worker entry: runs the crossfilter engine off the main thread.
// JSON.parse of every ~6.9 MB page and every filter pass happen here, never on the UI thread.

import { createCrossfilterEngine } from '@/workers/crossfilter.engine';
import type { CrossfilterMessageT, CrossfilterRequestT } from '@/workers/crossfilter.types';

const post = (message: CrossfilterMessageT) => (postMessage as unknown as (value: unknown) => void)(message);

const engine = createCrossfilterEngine(post);

onmessage = (event: MessageEvent) => {
  void engine.handle(event.data as CrossfilterRequestT);
};

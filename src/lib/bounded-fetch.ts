/** Bound dependency requests while preserving caller cancellation. */
export const boundedFetch: typeof fetch = (input, init) => {
  const timeout=AbortSignal.timeout(30_000);
  const signal=init?.signal??(input instanceof Request?input.signal:undefined);
  return fetch(input,{...init,signal:signal?AbortSignal.any([signal,timeout]):timeout});
};

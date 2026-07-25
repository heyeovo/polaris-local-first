// Module-level flags used by chatApiTransport to decide whether to send
// X-Ombre-Skip-Handoff / X-Ombre-Force-Handoff on the first request of a
// new conversation. Reset after every read so they only apply once.

let _skipHandoff = false;
let _forceHandoff = false;
let _handoffBucketIds: string[] | null = null;

export function setSkipHandoffForNextRequest(skip: boolean) {
  _skipHandoff = skip;
}

export function consumeSkipHandoffFlag(): boolean {
  const value = _skipHandoff;
  _skipHandoff = false;
  return value;
}

export function setForceHandoffForNextRequest(bucketIds?: string[]) {
  _forceHandoff = true;
  _handoffBucketIds = bucketIds ?? null;
}

export function consumeForceHandoffFlag(): { force: boolean; bucketIds: string[] | null } {
  const result = { force: _forceHandoff, bucketIds: _handoffBucketIds };
  _forceHandoff = false;
  _handoffBucketIds = null;
  return result;
}

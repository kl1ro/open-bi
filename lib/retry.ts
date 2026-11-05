export function retry<Result>(
  action: () => Promise<Result>,
  deps: RetryDeps,
): Promise<Result> {
  const innerDeps = { ...deps, action };
  return runAttempt(1, innerDeps);
}

export interface RetryDeps {
  attempts: number;
  baseDelay: number;
}

function runAttempt<Result>(
  attempt: number,
  deps: RunAttemptDeps<Result>,
): Promise<Result> {
  const result = deps.action();
  return result.catch((error: unknown) => retryAttemptAfterError(attempt, error, deps));
}

interface RunAttemptDeps<Result> {
  action: () => Promise<Result>;
  attempts: number;
  baseDelay: number;
}

async function retryAttemptAfterError<Result>(
  attempt: number,
  error: unknown,
  deps: RetryAttemptAfterErrorDeps<Result>,
): Promise<Result> {
  if (isLastAttempt(attempt, deps)) throw error;
  await waitBeforeNextAttempt(attempt, deps);
  return runAttempt(attempt + 1, deps);
}

interface RetryAttemptAfterErrorDeps<Result> {
  action: () => Promise<Result>;
  attempts: number;
  baseDelay: number;
}

function isLastAttempt(attempt: number, deps: IsLastAttemptDeps) {
  return attempt >= deps.attempts;
}

interface IsLastAttemptDeps {
  attempts: number;
}

function waitBeforeNextAttempt(attempt: number, deps: WaitBeforeNextAttemptDeps) {
  const delay = getRetryDelay(attempt, deps);
  return wait(delay);
}

interface WaitBeforeNextAttemptDeps {
  baseDelay: number;
}

function getRetryDelay(attempt: number, deps: GetRetryDelayDeps) {
  const exponentialDelay = deps.baseDelay * 2 ** (attempt - 1);
  const jitteredDelay = exponentialDelay * getJitterFactor();
  return jitteredDelay;
}

interface GetRetryDelayDeps {
  baseDelay: number;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function getJitterFactor() {
  return 0.5 + Math.random();
}

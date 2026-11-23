export function retry<Result>(
  action: () => Promise<Result>,
  deps: RetryDeps,
): Promise<Result> {
  const innerDeps = { ...deps, attempt: 1 };
  return runAction(action, innerDeps);
}

export interface RetryDeps {
  options: RetryOptions;
}

export interface RetryOptions {
  attempts: number;
  baseDelay: number;
}

function runAction<Result>(
  action: () => Promise<Result>,
  deps: RunActionDeps,
): Promise<Result> {
  const result = action();
  return result.catch((error: unknown) => retryActionAfterError(action, error, deps));
}

interface RunActionDeps {
  attempt: number;
  options: RetryOptions;
}

async function retryActionAfterError<Result>(
  action: () => Promise<Result>,
  error: unknown,
  deps: RetryActionAfterErrorDeps,
): Promise<Result> {
  if (isLastAttempt(deps.attempt, deps)) throw error;
  await waitBeforeNextAttempt(deps.attempt, deps);
  const innerDeps = { ...deps, attempt: deps.attempt + 1 };
  return runAction(action, innerDeps);
}

interface RetryActionAfterErrorDeps {
  attempt: number;
  options: RetryOptions;
}

function isLastAttempt(attempt: number, deps: IsLastAttemptDeps) {
  return attempt >= deps.options.attempts;
}

interface IsLastAttemptDeps {
  options: RetryOptions;
}

function waitBeforeNextAttempt(attempt: number, deps: WaitBeforeNextAttemptDeps) {
  const delay = getRetryDelay(attempt, deps);
  return wait(delay);
}

interface WaitBeforeNextAttemptDeps {
  options: RetryOptions;
}

function getRetryDelay(attempt: number, deps: GetRetryDelayDeps) {
  const exponentialDelay = deps.options.baseDelay * 2 ** (attempt - 1);
  const jitteredDelay = exponentialDelay * getJitterFactor();
  return jitteredDelay;
}

interface GetRetryDelayDeps {
  options: RetryOptions;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function getJitterFactor() {
  return 0.5 + Math.random();
}

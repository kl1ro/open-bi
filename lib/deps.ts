import { isPlainObject } from "@/lib/utils";

export default function bindDeps<
  Args extends unknown[],
  Deps extends object,
  ToBind extends Pick<Deps, keyof ToBind & keyof Deps>,
  Result,
>(target: (...args: [...Args, Deps]) => Result, toBind: ToBind) {
  validateBindDepsTarget(target);
  const targetWithBoundDeps = createTargetWithBoundDeps(target, toBind);
  const targetWithBoundDepsAndArity = copyArity(target, targetWithBoundDeps);
  return targetWithBoundDepsAndArity;
}

export type RemainingDepsParameter<Deps, ToBind> =
  Partial<RemainingDeps<Deps, ToBind>> extends RemainingDeps<Deps, ToBind>
    ? [deps?: RemainingDeps<Deps, ToBind>]
    : [deps: RemainingDeps<Deps, ToBind>];

export type RemainingDeps<Deps, ToBind> = Omit<Deps, keyof ToBind>;

function validateBindDepsTarget(target: (...args: never[]) => unknown) {
  if (!target.length) throw new BindDepsError({ targetName: target.name });
}

export class BindDepsError extends Error {
  public name = BindDepsError.name;
  public targetName: string;

  public constructor(options: ErrorOptions & { targetName: string }) {
    super(
      `Cannot bind deps to ${options.targetName || "an anonymous function"}: it reports no parameters, so the position of deps is unknown`,
      options,
    );

    this.targetName = options.targetName;
  }
}

function createTargetWithBoundDeps<
  Args extends unknown[],
  Deps extends object,
  ToBind extends Pick<Deps, keyof ToBind & keyof Deps>,
  Result,
>(target: (...args: [...Args, Deps]) => Result, toBind: ToBind) {
  const targetWithBoundDeps = (
    ...args: [...Args, ...RemainingDepsParameter<Deps, ToBind>]
  ) => {
    const split = splitTargetArguments<Args, RemainingDeps<Deps, ToBind>>(target, args);
    const deps = { ...split.passedDeps, ...toBind };
    return target(...split.leading, deps);
  };

  return targetWithBoundDeps;
}

function copyArity<Destination extends object>(
  source: (...args: never[]) => unknown,
  destination: Destination,
) {
  return Object.defineProperty(destination, "length", { value: source.length });
}

function splitTargetArguments<Args extends unknown[], PassedDeps>(
  target: (...args: never[]) => unknown,
  args: unknown[],
) {
  const depsIndex = target.length - 1;
  const leading = args.slice(0, depsIndex) as Args;
  const passedDeps = findPassedDeps(args[depsIndex]) as PassedDeps | undefined;
  return { leading, passedDeps };
}

function findPassedDeps(candidate: unknown): object | undefined {
  if (!isPlainObject(candidate)) return;
  return candidate;
}

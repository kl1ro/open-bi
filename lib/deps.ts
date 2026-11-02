import { isPlainObject } from "@/lib/utils";

export default function bindDeps<
  Args extends unknown[],
  Deps extends object,
  ToBind extends Pick<Deps, keyof ToBind & keyof Deps>,
  Result,
>(target: (...args: [...Args, Deps]) => Result, toBind: ToBind) {
  validateBindDepsTarget(target);
  const depsIndex = target.length - 1;

  const boundTarget = (...args: [...Args, ...RemainingDepsParameter<Deps, ToBind>]) => {
    const leading = args.slice(0, depsIndex) as Args;
    const remaining = (findPassedDeps(args[depsIndex]) ?? {}) as RemainingDeps<Deps, ToBind>;
    const deps = { ...remaining, ...toBind };
    return target(...leading, deps);
  };

  const boundTargetWithTargetArity = keepArity(boundTarget, target.length);

  return boundTargetWithTargetArity;
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

function findPassedDeps(argument: unknown): object | undefined {
  if (!isPlainObject(argument)) return;
  return argument;
}

function keepArity<Bound extends object>(bound: Bound, arity: number) {
  return Object.defineProperty(bound, "length", { value: arity });
}

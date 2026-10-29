import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function isNumber(suspect: unknown) {
  return typeof suspect === "number" && !Number.isNaN(suspect);
}

export function getRecordWithoutKey<Value>(
  record: Record<string, Value> | undefined,
  key: string,
): Record<string, Value> | undefined {
  if (!record) return;

  const recordWithoutKey = Object.fromEntries(
    Object.entries(record).filter(([recordKey]) => recordKey !== key),
  );

  return recordWithoutKey;
}

export function haveSameElements<Value>(first?: Value[], second?: Value[]) {
  if (!first || !second) return first === second;

  return (
    first.every((value) => second.includes(value)) &&
    second.every((value) => first.includes(value))
  );
}

export function bindDeps<
  Args extends unknown[],
  Deps extends object,
  ToBind extends Pick<Deps, keyof ToBind & keyof Deps>,
  Result,
>(target: (...args: [...Args, Deps]) => Result, toBind: ToBind) {
  return (...args: [...Args, ...RemainingDepsParameter<Deps, ToBind>]) => {
    const leading = args.slice(0, target.length - 1) as Args;
    const remaining = (args[target.length - 1] ?? {}) as RemainingDeps<Deps, ToBind>;
    const deps = { ...remaining, ...toBind };
    return target(...leading, deps);
  };
}

export type RemainingDepsParameter<Deps, ToBind> =
  Partial<RemainingDeps<Deps, ToBind>> extends RemainingDeps<Deps, ToBind>
    ? [deps?: RemainingDeps<Deps, ToBind>]
    : [deps: RemainingDeps<Deps, ToBind>];

export type RemainingDeps<Deps, ToBind> = Omit<Deps, keyof ToBind>;

export type WithRequired<Type, Key extends keyof Type> = Type & Required<Pick<Type, Key>>;

export type CoordinateKey = `${number}-${number}`;

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

  return Object.fromEntries(
    Object.entries(record).filter(([recordKey]) => recordKey !== key),
  );
}

export function haveSameElements<Value>(first?: Value[], second?: Value[]) {
  if (!first || !second) return first === second;

  return (
    first.every((value) => second.includes(value)) &&
    second.every((value) => first.includes(value))
  );
}

export type WithRequired<Type, Key extends keyof Type> = Type & Required<Pick<Type, Key>>;

export type CoordinateKey = `${number}-${number}`;

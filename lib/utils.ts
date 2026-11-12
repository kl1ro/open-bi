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

export function isPlainObject(suspect: unknown): suspect is object {
  if (typeof suspect !== "object" || !suspect) return false;
  const prototype: unknown = Object.getPrototypeOf(suspect);
  return prototype === Object.prototype || !prototype;
}

export type CoordinateKey = `${number}-${number}`;

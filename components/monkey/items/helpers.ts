import type { Pose } from "../body";
import type { Part } from "../parts";

/** Everything an item needs to fit the current pose. */
export interface FitContext {
  pose: Pose;
}

export type ItemArt = (ctx: FitContext) => Part[];

/**
 * Mirror an absolute path (M/L/C/Q/Z with coordinate pairs only) around a vertical axis.
 * Used to author one shoe/boot and reuse it for the other foot.
 */
export function mirrorX(d: string, axis: number): string {
  let isX = true;
  return d.replace(/-?\d+(\.\d+)?/g, (num) => {
    const v = Number(num);
    const out = isX ? 2 * axis - v : v;
    isX = !isX;
    return String(Math.round(out * 10) / 10);
  });
}

/** Translate an absolute path (same constraints as mirrorX). */
export function shift(d: string, dx: number, dy: number): string {
  let isX = true;
  return d.replace(/-?\d+(\.\d+)?/g, (num) => {
    const v = Number(num);
    const out = isX ? v + dx : v + dy;
    isX = !isX;
    return String(Math.round(out * 10) / 10);
  });
}

/** Axis between the two feet. */
export const FEET_AXIS = 301;

import { APP_VERSION } from "../config/version.ts";

export interface BuildInfo {
  version: string;
  date: string;
  time: string;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** ROC date string, e.g. 115/06/21. */
export function getBuildDate(date: Date = new Date()): string {
  const rocYear = date.getFullYear() - 1911;
  return `${rocYear}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

/** 24h time string, e.g. 09:05. */
export function getBuildTime(date: Date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getBuildInfo(date: Date = new Date()): BuildInfo {
  return {
    version: APP_VERSION,
    date: getBuildDate(date),
    time: getBuildTime(date),
  };
}

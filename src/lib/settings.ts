"use client";

import { useSyncExternalStore } from "react";

export interface Settings {
  /** 배경 음악 켜기 */
  bgm: boolean;
  /** 배경 음악 크기 (0 ~ 1) */
  bgmVolume: number;
  /** 효과음(팡파레 등) 켜기 */
  sfx: boolean;
  /** 효과음 크기 (0 ~ 1) */
  sfxVolume: number;
  /** 읽어주기(목소리) 켜기 */
  voice: boolean;
  /** 읽어주기 크기 (0 ~ 1) */
  voiceVolume: number;
}

const DEFAULTS: Settings = {
  bgm: true,
  bgmVolume: 0.4,
  sfx: true,
  sfxVolume: 0.7,
  voice: true,
  voiceVolume: 1,
};

const STORAGE_KEY = "hangeul-settings";

let current: Settings = DEFAULTS;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** 저장해둔 설정을 불러온다. 화면이 처음 뜰 때 한 번 부른다. */
export function loadSettings(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<Settings>;
    current = { ...DEFAULTS, ...saved };
    emit();
  } catch {
    // 저장된 값이 깨졌으면 기본값을 쓴다
  }
}

export function getSettings(): Settings {
  return current;
}

function getDefaultSettings(): Settings {
  return DEFAULTS;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // 저장이 안 돼도 이번 사용에는 지장이 없다
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getDefaultSettings);
}

export function subscribeSettings(listener: () => void): () => void {
  return subscribe(listener);
}

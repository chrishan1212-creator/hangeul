"use client";

import { useSyncExternalStore } from "react";

/**
 * 다 자란 친구가 모이는 동물 마을.
 *
 * settings.ts 와 같은 패턴: 모듈 안의 값 하나를 진실로 삼고
 * useSyncExternalStore 로 컴포넌트에 구독시킨다.
 */

const STORAGE_KEY = "hangeul-village";
const EMPTY: ReadonlySet<string> = new Set();

let current: ReadonlySet<string> = EMPTY;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** 저장해둔 마을을 불러온다. 화면이 처음 뜰 때 한 번 부른다. */
export function loadVillage(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const names = JSON.parse(raw) as string[];
    current = new Set(names);
    emit();
  } catch {
    // 저장된 값이 깨졌으면 빈 마을로 시작한다
  }
}

export function getVillage(): ReadonlySet<string> {
  return current;
}

/** 다 자란 친구를 마을에 입주시킨다. 이미 있으면 아무 일도 하지 않는다. */
export function moveIntoVillage(name: string): void {
  if (current.has(name)) return;
  current = new Set(current).add(name);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]));
  } catch {
    // 저장이 안 돼도 이번 놀이에는 지장이 없다
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getDefaultVillage(): ReadonlySet<string> {
  return EMPTY;
}

export function useVillage(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getVillage, getDefaultVillage);
}

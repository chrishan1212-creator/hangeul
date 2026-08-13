"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { syncBgm } from "@/lib/bgm";
import { unlockAudio } from "@/lib/audioContext";
import { playCorrect } from "@/lib/sfx";
import { cancelSpeech, hasKoreanVoice, primeSpeech, speak } from "@/lib/speech";
import { updateSettings, useSettings } from "@/lib/settings";

interface ToggleRowProps {
  emoji: string;
  label: string;
  hint?: string;
  on: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ emoji, label, hint, on, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/85 px-4 py-3 text-left transition hover:bg-white"
    >
      <span className="min-w-0">
        <span className="font-jua text-base text-slate-700">
          {emoji} {label}
        </span>
        {hint && <span className="mt-0.5 block font-jua text-xs text-slate-400">{hint}</span>}
      </span>
      <span
        className={`shrink-0 rounded-full px-3 py-1.5 font-jua text-sm ${
          on ? "bg-candy-green text-white" : "bg-slate-200 text-slate-500"
        }`}
      >
        {on ? "켜짐" : "꺼짐"}
      </span>
    </button>
  );
}

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const settings = useSettings();

  const [koreanVoiceMissing, setKoreanVoiceMissing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 설정 창을 열 때마다 한국어 목소리가 있는지 확인한다
  // (목록이 늦게 채워지는 기기가 있어서 열 때 다시 본다)
  useEffect(() => {
    if (!open) return;
    const check = () => setKoreanVoiceMissing(!hasKoreanVoice());
    check();
    const timer = setTimeout(check, 1200);
    return () => clearTimeout(timer);
  }, [open]);

  // 설정이 바뀌면 배경음악을 바로 반영한다
  useEffect(() => {
    syncBgm();
  }, [settings.bgm, settings.bgmVolume]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const openPanel = () => {
    // 설정 창을 여는 터치를 이용해 오디오를 깨워둔다
    unlockAudio();
    primeSpeech();
    setOpen(true);
  };

  const testSfx = () => {
    unlockAudio();
    playCorrect();
  };

  const testVoice = () => {
    primeSpeech();
    cancelSpeech();
    void speak("안녕! 나는 아기공룡이야.");
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label="설정 열기"
        className="rounded-full bg-white/25 px-3 py-2 text-xl backdrop-blur-sm transition hover:bg-white/35"
      >
        ⚙️
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="설정"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-candy-purple to-candy-pink p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-jua text-2xl text-white drop-shadow">⚙️ 설정</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="설정 닫기"
                className="rounded-full bg-white/30 px-3 py-1.5 font-jua text-lg text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <ToggleRow
                emoji="🎵"
                label="배경 음악"
                hint="잔잔한 음악이 작게 흐릅니다"
                on={settings.bgm}
                onChange={(next) => updateSettings({ bgm: next })}
              />

              {settings.bgm && (
                <div className="rounded-2xl bg-white/85 px-4 py-3">
                  <label
                    htmlFor="bgm-volume"
                    className="font-jua text-base text-slate-700"
                  >
                    🔉 음악 크기
                  </label>
                  <input
                    id="bgm-volume"
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={settings.bgmVolume}
                    onChange={(e) =>
                      updateSettings({ bgmVolume: Number(e.target.value) })
                    }
                    className="mt-2 w-full accent-candy-purple"
                  />
                </div>
              )}

              <ToggleRow
                emoji="🔔"
                label="효과음"
                hint="딩동댕동, 색종이 소리"
                on={settings.sfx}
                onChange={(next) => updateSettings({ sfx: next })}
              />

              <ToggleRow
                emoji="🗣️"
                label="읽어주기"
                hint="공룡 목소리와 단어 읽어주기"
                on={settings.voice}
                onChange={(next) => updateSettings({ voice: next })}
              />

              {koreanVoiceMissing && (
                <div className="rounded-2xl bg-amber-50 px-4 py-3">
                  <p className="font-jua text-base text-amber-800">
                    ⚠️ 한국어 목소리가 없어요
                  </p>
                  <p className="mt-1 font-jua text-xs text-amber-700">
                    안드로이드라면 <b>설정 → 접근성 → 화면 낭독기 → 텍스트 음성 변환</b>
                    에서 한국어 음성을 내려받아 주세요. 그 전까지는 읽어주기가 나오지 않지만,
                    음악과 효과음은 정상입니다.
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-white/85 px-4 py-3">
                <p className="font-jua text-base text-slate-700">🎧 소리 테스트</p>
                <p className="mt-0.5 font-jua text-xs text-slate-400">
                  안 들리면 아이폰 옆면의 무음 스위치를 확인해주세요
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={testSfx}
                    className="flex-1 rounded-xl bg-candy-blue px-3 py-2 font-jua text-sm text-white"
                  >
                    🔔 딩동댕동
                  </button>
                  <button
                    type="button"
                    onClick={testVoice}
                    className="flex-1 rounded-xl bg-candy-purple px-3 py-2 font-jua text-sm text-white"
                  >
                    🗣️ 목소리
                  </button>
                </div>
              </div>

              <Link
                href="/voice"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-white/25 px-4 py-3 text-center font-jua text-sm text-white transition hover:bg-white/35"
              >
                🔎 목소리 점검하기
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

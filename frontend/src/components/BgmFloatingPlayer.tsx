"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { createPortal } from "react-dom";
import { useBgmStore } from "@/stores/bgmStore";
import { BGM_TRACK, formatTime } from "@/lib/bgmAudio";
import {
  AlbumArt,
  BGM_COLLAPSED_TOKEN_ROTATION,
  CollapsedMusicToken,
  SpeakerMutedIcon,
  SpeakerOnIcon,
  getExpandedPlayerGlassStyle,
} from "@/components/BgmPlayerUI";

export default function BgmFloatingPlayer() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isPlaying   = useBgmStore((s) => s.isPlaying);
  const isMuted     = useBgmStore((s) => s.isMuted);
  const volume      = useBgmStore((s) => s.volume);
  const currentTime = useBgmStore((s) => s.currentTime);
  const duration    = useBgmStore((s) => s.duration);
  const toggle      = useBgmStore((s) => s.toggle);
  const toggleMute  = useBgmStore((s) => s.toggleMute);
  const setVolume   = useBgmStore((s) => s.setVolume);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  if (pathname === "/" || !mounted) return null;

  const isDark = resolvedTheme === "dark";
  const fillPct = (isMuted ? 0 : volume) * 100;
  const glass = getExpandedPlayerGlassStyle(isDark);

  return createPortal(
    <>
      <CollapsedMusicToken
        ariaLabel={expanded ? "배경음악 플레이어 닫기" : "배경음악 플레이어 열기"}
        isDark={isDark}
        isPlaying={isPlaying}
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          right: "1rem",
          bottom: "calc(3.5rem + env(safe-area-inset-bottom) + 0.75rem)",
          opacity: expanded ? 0 : 1,
          pointerEvents: expanded ? "none" : "auto",
          transform: expanded
            ? `scale(0.82) rotate(${BGM_COLLAPSED_TOKEN_ROTATION}deg)`
            : `rotate(${BGM_COLLAPSED_TOKEN_ROTATION}deg)`,
        }}
      />

      <div
        className="fixed right-4 z-40"
        style={{
          bottom: "calc(3.5rem + env(safe-area-inset-bottom) + 0.75rem)",
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? "auto" : "none",
          transform: expanded
            ? "translateY(0) scale(1)"
            : "translateY(6px) scale(0.96)",
          transformOrigin: "right bottom",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
      >
        <div
          className="rounded-[26px] overflow-hidden"
          style={{
            width: expanded ? "min(21.5rem, calc(100vw - 2rem))" : "48px",
            transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "width",
            ...glass,
          }}
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="w-12 h-12 shrink-0 relative flex items-center justify-center cursor-pointer select-none"
              onClick={() => setExpanded(false)}
            >
              <AlbumArt size="sm" />
            </div>

            <div
              className="flex-1 min-w-0 pr-1 cursor-pointer"
              style={{
                opacity: expanded ? 1 : 0,
                transition: expanded
                  ? "opacity 150ms ease 120ms"
                  : "opacity 100ms ease",
                pointerEvents: expanded ? "auto" : "none",
              }}
              onClick={() => setExpanded(false)}
            >
              <MarqueeTrackTitle
                title={BGM_TRACK.title}
                isActive={expanded && isPlaying}
                color={isDark ? "#f1f5f9" : "#1e293b"}
              />
              <p
                className="text-xs tabular-nums leading-tight mt-1"
                style={{ color: isDark ? "#64748b" : "#94a3b8" }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>

            <div
              className="ml-auto flex shrink-0 items-center gap-3 pl-3"
              style={{
                opacity: expanded ? 1 : 0,
                transition: expanded
                  ? "opacity 150ms ease 120ms"
                  : "opacity 100ms ease",
                pointerEvents: expanded ? "auto" : "none",
                borderLeft: isDark
                  ? "1px solid rgba(148, 163, 184, 0.14)"
                  : "1px solid rgba(148, 163, 184, 0.18)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <button
                  aria-label={isMuted ? "음소거 해제" : "음소거"}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-transform active:scale-90"
                  style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                >
                  {isMuted
                    ? <SpeakerMutedIcon className="w-4 h-4" />
                    : <SpeakerOnIcon className="w-4 h-4" />}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  aria-label="볼륨 조절"
                  className="shrink-0 w-16 cursor-pointer"
                  style={{
                    height: "4px",
                    borderRadius: "2px",
                    outline: "none",
                    WebkitAppearance: "none",
                    appearance: "none",
                    accentColor: "#e4701e",
                    background: `linear-gradient(to right, #e4701e ${fillPct}%, ${
                      isDark ? "#334155" : "#d1d5db"
                    } ${fillPct}%)`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <button
                aria-label={isPlaying ? "일시정지" : "재생"}
                className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-transform active:scale-90"
                style={{
                  background: isDark ? "rgba(228, 112, 30, 0.9)" : "#e4701e",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

function MarqueeTrackTitle({
  title,
  isActive,
  color,
}: {
  title: string;
  isActive: boolean;
  color: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [overflowPx, setOverflowPx] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current || !textRef.current) return;

      const nextOverflow = Math.max(
        0,
        Math.ceil(textRef.current.scrollWidth - containerRef.current.clientWidth)
      );

      setOverflowPx(nextOverflow > 4 ? nextOverflow : 0);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    const container = containerRef.current;
    const text = textRef.current;

    if (container) observer.observe(container);
    if (text) observer.observe(text);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [title]);

  const durationSeconds = overflowPx > 0
    ? Math.max(8, Math.round((overflowPx / 22 + 4.8) * 10) / 10)
    : 0;

  return (
    <>
      <div ref={containerRef} className="overflow-hidden">
        <p
          ref={textRef}
          className="text-sm font-semibold leading-tight whitespace-nowrap will-change-transform"
          style={{
            color,
            animationName: overflowPx > 0 ? "bgm-title-marquee" : "none",
            animationDuration: overflowPx > 0 ? `${durationSeconds}s` : undefined,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationFillMode: "both",
            animationPlayState: overflowPx > 0 && isActive ? "running" : "paused",
            ["--bgm-title-overflow" as string]: `-${overflowPx}px`,
          }}
        >
          {title}
        </p>
      </div>

      <style jsx>{`
        @keyframes bgm-title-marquee {
          0%,
          16% {
            transform: translateX(0);
          }

          82%,
          100% {
            transform: translateX(var(--bgm-title-overflow));
          }
        }
      `}</style>
    </>
  );
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="white"
      className="w-5 h-5 ml-0.5"
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="white"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

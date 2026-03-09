"use client";

import type { CSSProperties } from "react";
import { BGM_TRACK } from "@/lib/bgmAudio";

export const BGM_COLLAPSED_TOKEN_SIZE = 42;
export const BGM_COLLAPSED_TOKEN_ROTATION = -15;
export const HOME_BGM_ANCHOR_ID = "home-bgm-anchor";

export function getExpandedPlayerGlassStyle(isDark: boolean): CSSProperties {
  return isDark
    ? {
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(148, 163, 184, 0.15)",
        boxShadow: "0 4px 32px rgba(0, 0, 0, 0.5)",
      }
    : {
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.85)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.10)",
      };
}

function getCollapsedTokenGlassStyle(isDark: boolean, isPlaying: boolean): CSSProperties {
  return isDark
    ? {
        background: "rgba(15, 23, 42, 0.34)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: isPlaying
          ? "0 10px 22px rgba(251, 146, 60, 0.22), 0 0 16px rgba(228, 112, 30, 0.18)"
          : "0 8px 18px rgba(15, 23, 42, 0.18)",
      }
    : {
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255, 255, 255, 0.86)",
        boxShadow: isPlaying
          ? "0 10px 22px rgba(228, 112, 30, 0.18), 0 0 14px rgba(251, 146, 60, 0.14)"
          : "0 8px 18px rgba(15, 23, 42, 0.08)",
      };
}

interface CollapsedMusicTokenProps {
  ariaLabel: string;
  isDark: boolean;
  isPlaying: boolean;
  onClick: () => void;
  style?: CSSProperties;
  className?: string;
  position?: "fixed" | "absolute";
}

export function CollapsedMusicToken({
  ariaLabel,
  isDark,
  isPlaying,
  onClick,
  style,
  className,
  position = "fixed",
}: CollapsedMusicTokenProps) {
  const tokenGlass = getCollapsedTokenGlassStyle(isDark, isPlaying);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`z-40 rounded-[16px] cursor-pointer select-none ${className ?? ""}`}
      style={{
        position,
        width: BGM_COLLAPSED_TOKEN_SIZE,
        height: BGM_COLLAPSED_TOKEN_SIZE,
        transformOrigin: "center center",
        transition:
          "opacity 220ms ease, transform 220ms ease, top 280ms ease, left 280ms ease, right 280ms ease, bottom 280ms ease, box-shadow 220ms ease",
        ...tokenGlass,
        ...style,
      }}
      onClick={onClick}
    >
      {isPlaying && (
        <div
          className="absolute inset-[-4px] rounded-[18px] bgm-pulse-ring pointer-events-none"
          style={{ border: "1.5px solid rgba(228, 112, 30, 0.42)" }}
        />
      )}
      <div
        className="absolute inset-[4px] rounded-[13px]"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(251, 146, 60, 0.94) 0%, rgba(228, 112, 30, 0.88) 58%, rgba(194, 65, 12, 0.92) 100%)"
            : "linear-gradient(135deg, rgba(255, 195, 113, 0.96) 0%, rgba(251, 146, 60, 0.92) 55%, rgba(228, 112, 30, 0.96) 100%)",
          boxShadow: isPlaying
            ? "inset 0 1px 0 rgba(255,255,255,0.45)"
            : "inset 0 1px 0 rgba(255,255,255,0.32)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="rounded-[11px] px-1.5 py-1"
          style={{
            background: "rgba(255, 255, 255, 0.20)",
            boxShadow: isPlaying ? "0 0 10px rgba(255, 255, 255, 0.18)" : "none",
          }}
        >
          <MusicNoteIcon className="w-[18px] h-[18px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]" />
        </div>
      </div>
    </button>
  );
}

export function AlbumArt({ size }: { size: "lg" | "sm" }) {
  const cls =
    size === "lg"
      ? "w-11 h-11 rounded-xl shrink-0"
      : "absolute inset-1.5 rounded-lg";

  if (BGM_TRACK.artSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={BGM_TRACK.artSrc} alt="앨범아트" className={`${cls} object-cover`} />
    );
  }

  return (
    <div
      className={`${cls} flex items-center justify-center`}
      style={{
        background: "linear-gradient(135deg, #fb923c 0%, #e4701e 55%, #c05621 100%)",
      }}
    >
      <MusicNoteIcon size={size} />
    </div>
  );
}

function MusicNoteIcon({
  size,
  className,
}: {
  size?: "lg" | "sm";
  className?: string;
}) {
  const iconSize = className ?? (size === "lg" ? "w-5 h-5" : "w-4 h-4");

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      className={iconSize}>
      <path fillRule="evenodd"
        d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z"
        clipRule="evenodd" />
    </svg>
  );
}

export function SpeakerOnIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      className={className}>
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905H6.44l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
      <path d="M18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
      <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
    </svg>
  );
}

export function SpeakerMutedIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      className={className}>
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905H6.44l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
      <path d="M17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
    </svg>
  );
}

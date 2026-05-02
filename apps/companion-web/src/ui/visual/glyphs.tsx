/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/glyphs.tsx
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        0.3.0
 *
 * Description:
 *   Lightweight SVG glyphs for web-as-game UI (no external assets).
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import React from "react";
import type { NvUnitRole } from "@nyrvexis/protocol";
import { iconUrl } from "./iconRegistry";

export function roleClass(role: NvUnitRole): string {
  if (role === "tank") return "role tank";
  if (role === "dps") return "role dps";
  if (role === "support") return "role support";
  return "role control";
}

export function RoleBadge(props: { role: NvUnitRole }) {
  return <span className={roleClass(props.role)}>{props.role.toUpperCase()}</span>;
}

function RoleIcon(props: { role: NvUnitRole }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" as const };
  const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (props.role === "tank") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M12 2l8 4v7c0 5-3 9-8 9s-8-4-8-9V6l8-4Z" />
        <path {...stroke} d="M9 12h6" />
      </svg>
    );
  }
  if (props.role === "dps") {
    return (
      <svg {...common} aria-hidden="true">
        <circle {...stroke} cx="12" cy="12" r="7" />
        <path {...stroke} d="M12 5v4M12 15v4M5 12h4M15 12h4" />
      </svg>
    );
  }
  if (props.role === "support") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M12 5v14M5 12h14" />
        <path {...stroke} d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Z" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden="true">
      <path {...stroke} d="M12 3c4 2 6 5 6 9s-2 7-6 9c-4-2-6-5-6-9s2-7 6-9Z" />
      <path {...stroke} d="M9 9c1 1 2 1 3 0s2-1 3 0" />
    </svg>
  );
}

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function UnitGlyph(props: { archetypeId: string; role: NvUnitRole; iconId?: string; fxProfileId?: string }) {
  const h = hash32(props.iconId && props.iconId.length > 0 ? props.iconId : props.archetypeId);
  const variant = h % 3;
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none" as const };
  const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const url = iconUrl(props.iconId);

  return (
    <div className={`glyph ${props.role} ${props.fxProfileId ? `fx-${props.fxProfileId}` : ""}`} aria-hidden="true">
      {url ? <img src={url} alt="" width={18} height={18} style={{ display: "block" }} /> : <RoleIcon role={props.role} />}
      <svg {...common} className={`mark v${variant}`}>
        {variant === 0 ? <path {...stroke} d="M7 16l5-8l5 8" /> : null}
        {variant === 1 ? <path {...stroke} d="M8 8h8v8H8z" /> : null}
        {variant === 2 ? <path {...stroke} d="M12 7l4 4l-4 4l-4-4l4-4Z" /> : null}
      </svg>
    </div>
  );
}

export function EventGlyph(props: { kind: "hit" | "death" | "ability" | "status_apply" | "status_tick" | "end"; crit?: boolean }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none" as const };
  const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const k = props.kind;
  if (k === "hit") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M4 12h9" />
        <path {...stroke} d="M13 7l7 5l-7 5" />
        {props.crit ? <path {...stroke} d="M6 6l1 2l2 1l-2 1l-1 2l-1-2l-2-1l2-1l1-2Z" /> : null}
      </svg>
    );
  }
  if (k === "death") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M7 7l10 10M17 7L7 17" />
        <path {...stroke} d="M12 2c6 2 10 7 10 10c0 7-6 10-10 10S2 19 2 12c0-3 4-8 10-10Z" />
      </svg>
    );
  }
  if (k === "ability") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M12 2l2 7l7 2l-7 2l-2 7l-2-7l-7-2l7-2l2-7Z" />
      </svg>
    );
  }
  if (k === "status_apply") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M12 2v6M12 16v6" />
        <path {...stroke} d="M4 12h6M14 12h6" />
        <path {...stroke} d="M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8Z" />
      </svg>
    );
  }
  if (k === "status_tick") {
    return (
      <svg {...common} aria-hidden="true">
        <path {...stroke} d="M12 6v6l4 2" />
        <path {...stroke} d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Z" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden="true">
      <path {...stroke} d="M6 12h12" />
      <path {...stroke} d="M6 8h8" />
      <path {...stroke} d="M6 16h8" />
    </svg>
  );
}


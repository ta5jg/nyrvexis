#!/usr/bin/env python3
# =============================================================================
# File:           tools/header/header_core.py
# Author:         USDTG GROUP TECHNOLOGY LLC
# Developer:      Irfan Gedik
# Created Date:   2026-04-30
# Last Update:    2026-04-30
# Version:        0.3.0
#
# Description:
#   
#
# License:
#   Proprietary. All rights reserved. See LICENSE in the repository root.
# =============================================================================

# =============================================================================
# File:           tools/header/header_core.py
# Author:         USDTG GROUP TECHNOLOGY LLC
# Developer:      Irfan Gedik
# Created Date:   2026-04-30
# Last Update:    2026-04-30
# Version:        0.3.0
#
# Description:
#   
#
# License:
#   Proprietary. All rights reserved. See LICENSE in the repository root.
# =============================================================================

"""
Shared header-comment engine (config-driven).

Each repo keeps a tiny wrapper at `tools/add_header_comments.py` and a config at
`tools/header/header_config.py`. The core engine is identical across repos.
"""

from __future__ import annotations

import argparse
import datetime as _dt
from pathlib import Path
from typing import Iterable


HEADER_SENTINEL_BLOCK = "/* ============================================================================="
HEADER_SENTINEL_HASH = "# ============================================================================="
HEADER_SENTINEL_HTML = "<!-- ============================================================================="


def _today() -> str:
    return _dt.date.today().isoformat()


def _rel(root: Path, p: Path) -> str:
    try:
        return p.relative_to(root).as_posix()
    except Exception:
        return p.as_posix()


def _split_shebang(text: str) -> tuple[str, str]:
    if text.startswith("#!"):
        nl = text.find("\n")
        if nl == -1:
            return text, ""
        return text[: nl + 1], text[nl + 1 :]
    return "", text


def _has_header(raw: str) -> bool:
    head = raw.lstrip("\ufeff").lstrip()
    # If file starts with a shebang, header is expected on the next line.
    if head.startswith("#!"):
        nl = head.find("\n")
        head = head[nl + 1 :] if nl != -1 else ""
        head = head.lstrip()
    return head.startswith(HEADER_SENTINEL_BLOCK) or head.startswith(HEADER_SENTINEL_HASH) or head.startswith(HEADER_SENTINEL_HTML)


def _make_header_lines(*, rel_path: str, author: str, developer: str, created: str, updated: str, version: str, description: str) -> list[str]:
    desc_lines = [x.rstrip() for x in (description or "").splitlines()] or [""]
    if len(desc_lines) == 1 and desc_lines[0] == "":
        desc_block = [" *   \n"]
    else:
        desc_block = [f" *   {ln}\n" for ln in desc_lines]

    return [
        f" * File:           {rel_path}\n",
        f" * Author:         {author}\n",
        f" * Developer:      {developer}\n",
        f" * Created Date:   {created}\n",
        f" * Last Update:    {updated}\n",
        f" * Version:        {version}\n",
        " *\n",
        " * Description:\n",
        *desc_block,
        " *\n",
        " * License:\n",
        " *   Proprietary. All rights reserved. See LICENSE in the repository root.\n",
    ]


def _wrap_cblock(lines: list[str]) -> str:
    return "/* =============================================================================\n" + "".join(lines) + " * ============================================================================= */\n"


def _wrap_hash(lines: list[str]) -> str:
    lines2: list[str] = []
    for ln in lines:
        if ln.startswith(" * "):
            lines2.append("# " + ln[3:])
        elif ln.startswith(" *"):
            lines2.append("#" + ln[2:])
        else:
            lines2.append("# " + ln)
    return "# =============================================================================\n" + "".join(lines2) + "# =============================================================================\n"


def _wrap_html(lines: list[str]) -> str:
    out: list[str] = []
    for ln in lines:
        if ln.startswith(" * "):
            out.append(ln[3:])
        elif ln.startswith(" *"):
            out.append(ln[2:])
        else:
            out.append(ln)
    return "<!-- =============================================================================\n" + "".join(out) + "============================================================================= -->\n"


def run_with_config(
    *,
    root: str,
    apply: bool,
    version: str,
    author: str,
    developer: str,
    description: str,
    skip_dirs: Iterable[str],
    ext_cblock: Iterable[str],
    ext_hash: Iterable[str],
    ext_html: Iterable[str],
) -> int:
    root_path = Path(root).resolve()
    skip = set(skip_dirs)
    cblock = {e.lower() for e in ext_cblock}
    hsh = {e.lower() for e in ext_hash}
    html = {e.lower() for e in ext_html}

    created = _today()
    updated = created

    scanned = 0
    skipped = 0
    would_write = 0
    written = 0

    for p in root_path.rglob("*"):
        if not p.is_file():
            continue
        if any(part in skip for part in p.parts):
            continue

        ext = p.suffix.lower()
        style = "cblock" if ext in cblock else "hash" if ext in hsh else "html" if ext in html else None
        if style is None:
            continue

        scanned += 1
        try:
            raw = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            skipped += 1
            continue

        if _has_header(raw):
            skipped += 1
            continue

        shebang, rest = _split_shebang(raw)
        rel_path = _rel(root_path, p)
        lines = _make_header_lines(
            rel_path=rel_path,
            author=author,
            developer=developer,
            created=created,
            updated=updated,
            version=version,
            description=description,
        )
        header = _wrap_cblock(lines) if style == "cblock" else _wrap_hash(lines) if style == "hash" else _wrap_html(lines)
        out = shebang + header + "\n" + rest.lstrip("\ufeff")
        would_write += 1
        if apply:
            p.write_text(out, encoding="utf-8", newline="\n")
            written += 1

    print(f"scan={scanned} skip={skipped} {'written' if apply else 'would_write'}={written if apply else would_write}")
    if not apply:
        print("Dry-run only. Re-run with --apply to write changes.")
    return 0


def build_argparser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="Repo root to scan (default: .)")
    ap.add_argument("--apply", action="store_true", help="Actually write changes")
    ap.add_argument("--version", default="0.3.0", help="Header version field")
    ap.add_argument("--author", default="USDTG GROUP TECHNOLOGY LLC", help="Author field")
    ap.add_argument("--developer", default="Irfan Gedik", help="Developer field")
    ap.add_argument("--description", default="", help="Description text (blank by default)")
    return ap


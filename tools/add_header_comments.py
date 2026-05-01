#!/usr/bin/env python3
# =============================================================================
# File:           tools/add_header_comments.py
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
# File:           tools/add_header_comments.py
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
# File:           tools/add_header_comments.py
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
Wrapper script: delegates to the shared engine in `tools/header/header_core.py`.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure repo root is on sys.path so `tools.header.*` imports work.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.header.header_core import build_argparser, run_with_config
from tools.header.header_config import EXT_CBLOCK, EXT_HASH, EXT_HTML, SKIP_DIRS


def main() -> int:
    ap = build_argparser()
    args = ap.parse_args()
    return run_with_config(
        root=args.root,
        apply=args.apply,
        version=args.version,
        author=args.author,
        developer=args.developer,
        description=args.description,
        skip_dirs=SKIP_DIRS,
        ext_cblock=EXT_CBLOCK,
        ext_hash=EXT_HASH,
        ext_html=EXT_HTML,
    )


if __name__ == "__main__":
    raise SystemExit(main())


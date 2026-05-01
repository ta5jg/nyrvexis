# =============================================================================
# File:           tools/header/header_config.py
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

from __future__ import annotations

# Repo-local configuration for header insertion.

SKIP_DIRS = {
    ".git",
    ".idea",
    ".vscode",
    "node_modules",
    "dist",
    "build",
    ".kr-data",
    "artifacts",
}

EXT_CBLOCK = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".scss",
    ".less",
    ".c",
    ".cc",
    ".cpp",
    ".h",
    ".hpp",
    ".mdx",
}

EXT_HASH = {".sh", ".bash", ".zsh", ".py", ".rb", ".yml", ".yaml", ".toml", ".env"}

EXT_HTML = {".md", ".html"}


<!-- =============================================================================
File:           docs/HEADER_COMMENT.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-04-30
Version:        0.3.0

Description:
  

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

# Header Comment Standard (Kindrail)

Referans format: `Nyrvexa/tools/SimRunner/BiomeJsonNet.cs`.

## Otomatik ekleme (bulk)

Script: `tools/add_header_comments.py`

### Dry-run

```bash
python3 tools/add_header_comments.py --root .
```

### Apply (dosyaları yazar)

```bash
python3 tools/add_header_comments.py --root . --apply
```

## Kapsam

- `/* ... */`: TS/JS/CSS vb.
- `# ...`: `.yml/.yaml`, `.sh`, `.py`, `.env` vb.
- `<!-- ... -->`: Markdown/HTML.

> Not: JSON/lock dosyaları yorum kabul etmediği için script bunları **atlanır**.


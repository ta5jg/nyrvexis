## Nyrvexis Unity arena bridge

Drop-in scripts + replay JSON aligned with `@nyrvexis/protocol` battle DTOs. Gateway stays authoritative; Unity consumes the same JSON.

**Turkish step-by-step:** [`UNITY_SETUP.md`](./UNITY_SETUP.md)

### Layout

```
UnityPackage/
  Assets/
    Nyrvexis/
      Scripts/
        Nyrvexis.ReplayBridge.asmdef    # references Newtonsoft.Json package
      Resources/
        nyrvexis-golden-battle-export.json   # golden-scene default
        nyrvexis-sample-battle-export.json   # fallback
manifest-snippet.json                     # merge into your project's Packages/manifest.json
```

### Golden scene (5 Animator states)

Create an **Animator Controller** on your unit prefab with **exact state names**:

| State | When |
|--------|------|
| **Idle** | Default / between beats |
| **Advance** | `maneuver_*`, `shield_self`, `taunt_self` |
| **Attack** | `hit` attacker + generic abilities |
| **Hit** | `hit` target (damage or MISS-style react) |
| **Death** | `death` |

Constants: `NyrvexisAnimStates` in `NyrvexisAnimStates.cs`. Hook **Animator** on the prefab root or child; `UnitBattlePresentation` uses `GetComponentInChildren<Animator>()`.

Without a Controller, playback stays **offset-only** (capsules still move).

### Unity Editor setup

1. Unity Hub → **New project** → **3D** — **2022.3 LTS** or newer (2021.3 LTS OK).
2. Add **`com.unity.nuget.newtonsoft-json`** — see [`manifest-snippet.json`](./manifest-snippet.json).
3. Copy **`UnityPackage/Assets/Nyrvexis`** into your project **`Assets/`** (Unity generates `.meta` on import).
4. Ensure **`Nyrvexis.ReplayBridge.asmdef`** sits under `Assets/Nyrvexis/Scripts/` (ships with the package).
5. Empty GameObject → **`NyrvexisReplayDirector`** (`Nyrvexis.Arena`).
6. **Play** — loads **`Resources/nyrvexis-golden-battle-export`** first, then sample fallback.
7. Optional: disable **Play On Awake** and wire a UI Button → **`PlayReplayFromBeginning()`** for repeatable playback without reloading the scene.

### Refresh golden JSON from gateway

With gateway running:

```bash
pnpm run unity:golden-export
# or
GATEWAY_URL=http://127.0.0.1:8787 node scripts/export-golden-unity-battle.mjs
```

Writes a fresh **`request` + `result`** bundle to `UnityPackage/Assets/Nyrvexis/Resources/nyrvexis-golden-battle-export.json`.

### Export format (`NyrvexisBattleExportDto`)

```json
{
  "request": { ... KrBattleSimRequest ... },
  "result": { ... KrBattleSimResult ... }
}
```

Events may include optional **`presentation`** (`srcIntent` / `dstIntent`): `idle|advance|attack|hit|death` — SSOT from gateway sim for Unity / future web rig; ignored for scoring.

**Companion web:** after **Run battle**, use **Export Unity JSON** for the same bundle; replace `Resources/nyrvexis-golden-battle-export.json` or point `NyrvexisReplayDirector` at your asset name.

### Related

- Protocol: `packages/protocol/src/v1/battle.ts`
- Sim: `services/gateway/src/sim/battleSim.ts`
- Endpoint: `POST /sim/battle` (body = `KrBattleSimRequest`)

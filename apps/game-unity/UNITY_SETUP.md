# Nyrvexis Unity — kurulum (Unity-friendly)

Bu paket (`UnityPackage/Assets/Nyrvexis`) companion-web / gateway ile **aynı battle export JSON**’unu oynatır. Simülasyon SSOT gateway’de kalır; Unity yalnızca sunum katmanıdır.

## 1) Yeni Unity projesi

- Unity Hub → **3D (URP/Built-in fark etmez)** — **2022.3 LTS** önerilir (2021.3 LTS ile de uyumludur).
- Boş sahneyi kaydedebilir veya doğrudan Play sahnesini oluşturabilirsin.

## 2) Newtonsoft.Json paketi

**Window → Package Manager → Unity Registry** içinde **Newtonsoft Json** ara ve yükle.

Alternatif: proje kökündeki `Packages/manifest.json` içine şunu birleştir (tam dosya değil — `dependencies` içine ekle):

```json
"com.unity.nuget.newtonsoft-json": "3.2.1"
```

Kaynak: repoda `apps/game-unity/manifest-snippet.json`.

## 3) Nyrvexis varlıklarını kopyala

Şunu Unity projenin `Assets/` altına kopyala:

```text
apps/game-unity/UnityPackage/Assets/Nyrvexis   →   YourProject/Assets/Nyrvexis
```

İlk importta Unity `.meta` dosyalarını oluşturur; sabit GUID istiyorsan repoya `.meta` eklemek gerekir (şimdilik Editor üretir).

## 4) Assembly Definition

`Assets/Nyrvexis/Scripts/Nyrvexis.ReplayBridge.asmdef` paketi **`Newtonsoft.Json`** derlemesine referanslar. Paket yüklü değilse derleme hatası alırsın — adım 2.

## 5) Golden sahne (Play)

1. Hierarchy → boş GameObject → adı örn. `NyrvexisReplay`.
2. **Add Component → `NyrvexisReplayDirector`** (`Nyrvexis.Arena`).
3. İstersen **Export JSON**’u doğrudan Inspector’dan **Battle Export Json** alanına sürükleyebilirsin; boş bırakırsan `Resources/nyrvexis-golden-battle-export` → fallback `nyrvexis-sample-battle-export` yüklenir.
4. **Play**.

### Animator (5 durum)

Prefab veya capsule üzerinde **Animator + Controller**; state isimleri: **Idle**, **Advance**, **Attack**, **Hit**, **Death** (`NyrvexisAnimStates.cs`). Yoksa sadece kapsül kayması çalışır.

### Tekrar oynatma (UI Button)

- Inspector’da **`Play On Awake`** kapatılabilir.
- UI Button **OnClick()** → `NyrvexisReplayDirector.PlayReplayFromBeginning`.

## 6) JSON güncelleme

Gateway açıkken repoda:

```bash
pnpm run unity:golden-export
```

Çıktı: `UnityPackage/Assets/Nyrvexis/Resources/nyrvexis-golden-battle-export.json`

Companion-web’de **Export Unity JSON** ile aynı format indirilebilir.

## Sorun giderme

| Sorun | Çözüm |
|--------|--------|
| `Nyrvexis.ReplayBridge` Newtonsoft bulamıyor | Package Manager’dan `com.unity.nuget.newtonsoft-json` kuruldu mu kontrol et. |
| Hiçbir şey spawn olmuyor | `Resources` klasör adı tam olarak `Resources`; JSON `TextAsset` olarak import edilmiş mi. |
| Animator oynamıyor | Controller state adları tam eşleşmeli; runtime’da Controller atanmış mı. |

İngilizce özet: `README.md` (aynı klasör).

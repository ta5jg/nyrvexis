using System.Collections;
using System.Collections.Generic;
using Nyrvexis.Protocol;
using Nyrvexis.Replay;
using Newtonsoft.Json;
using UnityEngine;

namespace Nyrvexis.Arena
{
    /// <summary>
    /// Golden-scene driver: loads export JSON, spawns units, maps ticks → root offsets + five-state Animator.
    /// Hook <see cref="PlayReplayFromBeginning"/> to a UI Button for designer-friendly iteration.
    /// </summary>
    public sealed class NyrvexisReplayDirector : MonoBehaviour
    {
        [Header("Export JSON (gateway / companion ‘Export Unity JSON’)")]
        [Tooltip("Optional; if null, loads Resources by name below.")]
        [SerializeField]
        private TextAsset battleExportJson;

        [SerializeField]
        private string primaryResourceName = "nyrvexis-golden-battle-export";

        [SerializeField]
        private string fallbackResourceName = "nyrvexis-sample-battle-export";

        [Header("Arena layout (matches web ArenaCanvas ratios → world XZ)")]
        [SerializeField]
        private float halfArenaWidth = 5f;

        [SerializeField]
        private float halfArenaDepth = 2.5f;

        [Header("Playback")]
        [SerializeField]
        private float secondsPerTick = 0.08f;

        [SerializeField]
        private float visualDecayPerTick = 0.78f;

        [Tooltip("If off, call PlayReplayFromBeginning() from script or a Button OnClick.")]
        [SerializeField]
        private bool playOnAwake = true;

        [Header("Prefabs")]
        [Tooltip("Optional; default is a primitive capsule with UnitActor + UnitBattlePresentation.")]
        [SerializeField]
        private GameObject unitPrefab;

        private readonly Dictionary<string, UnitActor> _actors = new();
        private BattleReplayIndex _index;
        private NyrvexisBattleExportDto _bundle;
        private Coroutine _playCo;

        private void Start()
        {
            if (!Bootstrap())
                return;
            SpawnAll(_bundle.Request);
            foreach (var a in _actors.Values)
            {
                var pres = Pres(a);
                if (pres != null && pres.HasAnimator)
                    pres.PlayIdle();
            }

            if (playOnAwake)
                _playCo = StartCoroutine(PlayRoutine());
        }

        /// <summary>Reload-safe replay from tick 0 (respawns if empty after domain reload).</summary>
        public void PlayReplayFromBeginning()
        {
            if (_bundle == null && !Bootstrap())
                return;
            if (_index == null)
                _index = new BattleReplayIndex(_bundle.Result);
            if (_actors.Count == 0)
                SpawnAll(_bundle.Request);

            if (_playCo != null)
            {
                StopCoroutine(_playCo);
                _playCo = null;
            }

            foreach (var a in _actors.Values)
            {
                a.ResetForReplay();
                Pres(a)?.SnapToIdle();
            }

            _playCo = StartCoroutine(PlayRoutine());
        }

        private bool Bootstrap()
        {
            var ta = battleExportJson;
            if (ta == null && !string.IsNullOrEmpty(primaryResourceName))
                ta = Resources.Load<TextAsset>(primaryResourceName);
            if (ta == null && !string.IsNullOrEmpty(fallbackResourceName))
                ta = Resources.Load<TextAsset>(fallbackResourceName);

            if (ta == null)
            {
                Debug.LogWarning("[Nyrvexis] No battle export JSON assigned or in Resources.");
                return false;
            }

            _bundle = JsonConvert.DeserializeObject<NyrvexisBattleExportDto>(ta.text);
            if (_bundle?.Request == null || _bundle.Result == null)
            {
                Debug.LogError("[Nyrvexis] Export must include request + result.");
                _bundle = null;
                return false;
            }

            _index = new BattleReplayIndex(_bundle.Result);
            return true;
        }

        private void SpawnAll(KrBattleSimRequestDto req)
        {
            foreach (var u in req.A.Units)
                SpawnOne(u.Id, "a", u.Slot);
            foreach (var u in req.B.Units)
                SpawnOne(u.Id, "b", u.Slot);
        }

        private static UnitBattlePresentation Pres(UnitActor a) =>
            a.GetComponent<UnitBattlePresentation>();

        private void SpawnOne(string id, string side, int slot)
        {
            if (_actors.ContainsKey(id))
                return;

            var go = unitPrefab != null
                ? Instantiate(unitPrefab, transform)
                : GameObject.CreatePrimitive(PrimitiveType.Capsule);
            go.name = $"unit_{id}";
            var actor = go.GetComponent<UnitActor>() ?? go.AddComponent<UnitActor>();
            if (go.GetComponent<UnitBattlePresentation>() == null)
                go.AddComponent<UnitBattlePresentation>();
            actor.Initialize(id, side, slot, halfArenaWidth, halfArenaDepth);
            var pres = Pres(actor);
            if (pres != null && pres.HasAnimator)
                pres.PlayIdle();
            _actors[id] = actor;
        }

        private IEnumerator PlayRoutine()
        {
            var max = _bundle.Result.Ticks;
            for (var tick = 0; tick <= max; tick++)
            {
                foreach (var a in _actors.Values)
                {
                    if (!a.IsDead)
                        a.DecayVisual(visualDecayPerTick);
                }

                ApplyTick(tick);
                yield return new WaitForSeconds(secondsPerTick);
            }

            _playCo = null;
        }

        private void ApplyTick(int tick)
        {
            foreach (var ev in _index.EventsAtTick(tick))
            {
                switch (ev.Kind)
                {
                    case "death":
                        if (!string.IsNullOrEmpty(ev.Dst) && _actors.TryGetValue(ev.Dst, out var dead))
                        {
                            dead.MarkDead();
                            if (!string.IsNullOrEmpty(ev.Presentation?.DstIntent))
                                Pres(dead)?.PlayFromIntent(ev.Presentation.DstIntent);
                            else
                                Pres(dead)?.PlayDeath();
                        }
                        break;

                    case "hit":
                        if (!string.IsNullOrEmpty(ev.Dst) && _actors.TryGetValue(ev.Dst, out var tgt))
                        {
                            var dmg = ev.Dmg ?? 0;
                            if (!string.IsNullOrEmpty(ev.Presentation?.DstIntent))
                                Pres(tgt)?.PlayFromIntent(ev.Presentation.DstIntent);
                            else
                                Pres(tgt)?.PlayHit();
                            var back = tgt.Side == "a" ? -Vector3.right : Vector3.right;
                            tgt.AddVisualOffset(back * (dmg > 0 ? 0.28f : 0.42f) + Vector3.up * 0.06f);
                        }
                        if (!string.IsNullOrEmpty(ev.Src) && _actors.TryGetValue(ev.Src, out var atk))
                        {
                            if (!string.IsNullOrEmpty(ev.Presentation?.SrcIntent))
                                Pres(atk)?.PlayFromIntent(ev.Presentation.SrcIntent);
                            else
                                Pres(atk)?.PlayAttack();
                            if (!string.IsNullOrEmpty(ev.Dst) && _actors.TryGetValue(ev.Dst, out var d))
                                atk.FaceToward(d.transform.position);
                            atk.AddVisualOffset((atk.Side == "a" ? Vector3.right : -Vector3.right) * 0.38f);
                        }
                        break;

                    case "ability":
                        if (string.IsNullOrEmpty(ev.Src) || !_actors.TryGetValue(ev.Src, out var src))
                            break;
                        var aid = ev.AbilityId ?? "";
                        var toward = src.Side == "a" ? Vector3.right : -Vector3.right;

                        if (!string.IsNullOrEmpty(ev.Presentation?.SrcIntent))
                        {
                            Pres(src)?.PlayFromIntent(ev.Presentation.SrcIntent);
                            if (aid.StartsWith("maneuver_"))
                            {
                                if (aid.Contains("take_cover"))
                                    src.AddVisualOffset(-toward * 0.52f + Vector3.back * 0.12f);
                                else if (aid.Contains("probe"))
                                    src.AddVisualOffset(toward * 0.55f);
                                else if (aid.Contains("bound"))
                                    src.AddVisualOffset(Vector3.forward * 0.38f * (src.Slot % 2 == 0 ? 1f : -1f));
                            }
                            else if (aid == "shield_self" || aid == "taunt_self")
                                src.AddVisualOffset(-toward * 0.15f + Vector3.up * 0.02f);
                            break;
                        }

                        if (aid.StartsWith("maneuver_") || aid == "shield_self" || aid == "taunt_self")
                        {
                            Pres(src)?.PlayAdvance();
                            if (aid.Contains("take_cover"))
                                src.AddVisualOffset(-toward * 0.52f + Vector3.back * 0.12f);
                            else if (aid.Contains("probe"))
                                src.AddVisualOffset(toward * 0.55f);
                            else if (aid.Contains("bound"))
                                src.AddVisualOffset(Vector3.forward * 0.38f * (src.Slot % 2 == 0 ? 1f : -1f));
                            else if (aid == "shield_self" || aid == "taunt_self")
                                src.AddVisualOffset(-toward * 0.15f + Vector3.up * 0.02f);
                        }
                        else
                        {
                            Pres(src)?.PlayAttack();
                        }
                        break;
                }
            }
        }
    }
}

using UnityEngine;

namespace Nyrvexis.Arena
{
    /// <summary>
    /// Tactical anchor + small root offsets. Death freezes displacement.
    /// </summary>
    public sealed class UnitActor : MonoBehaviour
    {
        public string UnitId { get; private set; }
        public string Side { get; private set; }
        public int Slot { get; private set; }
        public bool IsDead { get; private set; }

        private Vector3 _home;
        private Vector3 _visualOffset;

        public void Initialize(string unitId, string side, int slot, float halfWidth, float halfDepth)
        {
            UnitId = unitId;
            Side = side;
            Slot = slot;
            IsDead = false;
            _home = ArenaLayout.SlotWorldXZ(side, slot, halfWidth, halfDepth);
            _visualOffset = Vector3.zero;
            ApplyPosition();
        }

        public void MarkDead()
        {
            IsDead = true;
        }

        /// <summary>Alive again + home pose — used when replay restarts from tick 0.</summary>
        public void ResetForReplay()
        {
            IsDead = false;
            _visualOffset = Vector3.zero;
            transform.rotation = Quaternion.identity;
            ApplyPosition();
        }

        public Vector3 Home => _home;

        public void ClearVisualOffset()
        {
            if (IsDead) return;
            _visualOffset = Vector3.zero;
            ApplyPosition();
        }

        public void AddVisualOffset(Vector3 delta)
        {
            if (IsDead) return;
            _visualOffset += delta;
            ApplyPosition();
        }

        public void DecayVisual(float keep)
        {
            if (IsDead) return;
            _visualOffset *= keep;
            ApplyPosition();
        }

        private void ApplyPosition()
        {
            transform.position = _home + _visualOffset;
        }

        public void FaceToward(Vector3 worldTarget)
        {
            if (IsDead) return;
            var p = transform.position;
            var dir = worldTarget - p;
            dir.y = 0f;
            if (dir.sqrMagnitude < 1e-4f) return;
            transform.rotation = Quaternion.LookRotation(dir.normalized, Vector3.up);
        }
    }
}

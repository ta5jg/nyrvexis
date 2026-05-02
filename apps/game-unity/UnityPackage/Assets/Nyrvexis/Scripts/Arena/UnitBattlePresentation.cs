using UnityEngine;

namespace Nyrvexis.Arena
{
    /// <summary>
    /// Maps replay events → five readable poses. Assign Animator + Controller with matching state names.
    /// Without Animator, behaviour is a no-op (capsule offset-only mode).
    /// </summary>
    public sealed class UnitBattlePresentation : MonoBehaviour
    {
        [SerializeField]
        private Animator animator;

        [SerializeField]
        private float crossFade = 0.1f;

        private void Awake()
        {
            if (animator == null)
                animator = GetComponentInChildren<Animator>(true);
        }

        public bool HasAnimator => animator != null && animator.runtimeAnimatorController != null;

        /// <summary>Optional SSOT anim hint from gateway (<c>idle|advance|attack|hit|death</c>).</summary>
        public void PlayFromIntent(string intent)
        {
            if (!HasAnimator || string.IsNullOrEmpty(intent)) return;
            switch (intent.ToLowerInvariant())
            {
                case "idle":
                    Cross(NyrvexisAnimStates.Idle);
                    break;
                case "advance":
                    PlayAdvance();
                    break;
                case "attack":
                    PlayAttack();
                    break;
                case "hit":
                    PlayHit();
                    break;
                case "death":
                    PlayDeath();
                    break;
                default:
                    break;
            }
        }

        public void PlayIdle()
        {
            Cross(NyrvexisAnimStates.Idle);
        }

        /// <summary>Instant return to Idle (replay restart / UI “Play again”).</summary>
        public void SnapToIdle()
        {
            if (!HasAnimator) return;
            animator.CrossFade(NyrvexisAnimStates.Idle, 0f, 0, 0f);
        }

        /// <summary>Maneuvers, repositioning, brace — exaggerated but grounded staging.</summary>
        public void PlayAdvance()
        {
            Cross(NyrvexisAnimStates.Advance);
        }

        public void PlayAttack()
        {
            Cross(NyrvexisAnimStates.Attack);
        }

        public void PlayHit()
        {
            Cross(NyrvexisAnimStates.Hit);
        }

        public void PlayDeath()
        {
            Cross(NyrvexisAnimStates.Death, 0.06f);
        }

        private void Cross(string state, float? blend = null)
        {
            if (!HasAnimator) return;
            var b = blend ?? crossFade;
            animator.CrossFade(state, b, 0, 0f);
        }
    }
}

using System.Collections.Generic;
using System.Linq;
using Nyrvexis.Protocol;

namespace Nyrvexis.Replay
{
    /// <summary>
    /// Stable-sort battle events and bucket by tick (matches companion-web replay ordering).
    /// </summary>
    public sealed class BattleReplayIndex
    {
        public readonly KrBattleSimResultDto Result;
        private readonly List<KrBattleEventDto>[] _byTick;

        public BattleReplayIndex(KrBattleSimResultDto result)
        {
            Result = result;
            var maxT = result.Ticks;
            _byTick = new List<KrBattleEventDto>[maxT + 1];
            for (var i = 0; i <= maxT; i++)
                _byTick[i] = new List<KrBattleEventDto>();

            var events = result.Events ?? new List<KrBattleEventDto>();
            var sorted = events
                .Select((e, i) => (e, i))
                .OrderBy(x => x.e.T)
                .ThenBy(x => x.i)
                .Select(x => x.e)
                .ToList();

            foreach (var ev in sorted)
            {
                var ti = ev.T;
                if (ti < 0 || ti > maxT) continue;
                _byTick[ti].Add(ev);
            }
        }

        public IReadOnlyList<KrBattleEventDto> EventsAtTick(int t)
        {
            if (t < 0 || t >= _byTick.Length) return System.Array.Empty<KrBattleEventDto>();
            return _byTick[t];
        }
    }
}

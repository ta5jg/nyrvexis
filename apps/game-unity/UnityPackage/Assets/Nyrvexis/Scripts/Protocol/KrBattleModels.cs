using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace Nyrvexis.Protocol
{
    [Serializable]
    public sealed class KrBattleSeedDto
    {
        [JsonProperty("seed")]
        public string Seed { get; set; } = "";
    }

    [Serializable]
    public sealed class KrUnitDto
    {
        [JsonProperty("id")]
        public string Id { get; set; } = "";

        [JsonProperty("archetype")]
        public string Archetype { get; set; } = "";

        [JsonProperty("hp")]
        public int Hp { get; set; }

        [JsonProperty("atk")]
        public int Atk { get; set; }

        [JsonProperty("def")]
        public int Def { get; set; }

        [JsonProperty("spd")]
        public int Spd { get; set; }

        [JsonProperty("slot")]
        public int Slot { get; set; }

        [JsonProperty("critPct")]
        public int? CritPct { get; set; }

        [JsonProperty("critMulPct")]
        public int? CritMulPct { get; set; }
    }

    [Serializable]
    public sealed class KrTeamDto
    {
        [JsonProperty("name")]
        public string Name { get; set; } = "";

        [JsonProperty("units")]
        public List<KrUnitDto> Units { get; set; } = new();
    }

    [Serializable]
    public sealed class KrBattleSimRequestDto
    {
        [JsonProperty("v")]
        public int V { get; set; }

        [JsonProperty("seed")]
        public KrBattleSeedDto Seed { get; set; } = new();

        [JsonProperty("a")]
        public KrTeamDto A { get; set; } = new();

        [JsonProperty("b")]
        public KrTeamDto B { get; set; } = new();

        [JsonProperty("maxTicks")]
        public int? MaxTicks { get; set; }
    }

    [Serializable]
    public sealed class KrStatusApplyDto
    {
        [JsonProperty("kind")]
        public string Kind { get; set; } = "";

        [JsonProperty("dur")]
        public int Dur { get; set; }

        [JsonProperty("mag")]
        public int Mag { get; set; }
    }

    [Serializable]
    public sealed class KrBattleEventPresentationDto
    {
        [JsonProperty("srcIntent")]
        public string SrcIntent { get; set; }

        [JsonProperty("dstIntent")]
        public string DstIntent { get; set; }
    }

    [Serializable]
    public sealed class KrBattleEventDto
    {
        [JsonProperty("t")]
        public int T { get; set; }

        [JsonProperty("kind")]
        public string Kind { get; set; } = "";

        [JsonProperty("src")]
        public string Src { get; set; }

        [JsonProperty("dst")]
        public string Dst { get; set; }

        [JsonProperty("dmg")]
        public int? Dmg { get; set; }

        [JsonProperty("crit")]
        public bool? Crit { get; set; }

        [JsonProperty("status")]
        public KrStatusApplyDto Status { get; set; }

        [JsonProperty("abilityId")]
        public string AbilityId { get; set; }

        [JsonProperty("presentation")]
        public KrBattleEventPresentationDto Presentation { get; set; }
    }

    [Serializable]
    public sealed class KrRemainingDto
    {
        [JsonProperty("a")]
        public Dictionary<string, int> A { get; set; } = new();

        [JsonProperty("b")]
        public Dictionary<string, int> B { get; set; } = new();
    }

    [Serializable]
    public sealed class KrBattleSimResultDto
    {
        [JsonProperty("v")]
        public int V { get; set; }

        [JsonProperty("seed")]
        public KrBattleSeedDto Seed { get; set; } = new();

        [JsonProperty("outcome")]
        public string Outcome { get; set; } = "";

        [JsonProperty("ticks")]
        public int Ticks { get; set; }

        [JsonProperty("remaining")]
        public KrRemainingDto Remaining { get; set; } = new();

        [JsonProperty("events")]
        public List<KrBattleEventDto> Events { get; set; } = new();
    }

    /// <summary>
    /// Bundle saved from web/tools: one JSON with request + result for Unity bootstrap.
    /// </summary>
    [Serializable]
    public sealed class NyrvexisBattleExportDto
    {
        [JsonProperty("request")]
        public KrBattleSimRequestDto Request { get; set; }

        [JsonProperty("result")]
        public KrBattleSimResultDto Result { get; set; }
    }
}

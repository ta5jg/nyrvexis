using UnityEngine;

namespace Nyrvexis.Arena
{
    /// <summary>
    /// Slot positions aligned with web ArenaCanvas ARENA_FORMATION (normalized → world XZ).
    /// </summary>
    public static class ArenaLayout
    {
        private const float LeftXRatio = 0.245f;
        private const float RightXRatio = 0.755f;
        private const float YFrontRatio = 0.275f;
        private const float YBackRatio = 0.82f;
        private const float DxRatio = 0.14f;
        private const float FrontMidBiasRatio = 0.032f;
        private const float BackMidBiasRatio = 0.018f;

        /// <summary>
        /// Arena extent on XZ plane (center at origin).
        /// </summary>
        public static Vector3 SlotWorldXZ(string side, int slot, float halfWidth = 5f, float halfDepth = 2.5f)
        {
            var w = halfWidth * 2f;
            var h = halfDepth * 2f;
            var leftX = w * LeftXRatio - halfWidth;
            var rightX = w * RightXRatio - halfWidth;
            var yFront = h * YFrontRatio - halfDepth;
            var yBack = h * YBackRatio - halfDepth;
            var dx = w * DxRatio;
            var af = w * FrontMidBiasRatio;
            var ab = w * BackMidBiasRatio;

            float x;
            float z;
            switch (side.ToLowerInvariant())
            {
                case "a":
                    switch (slot)
                    {
                        case 0: x = leftX - dx + af; z = yFront; break;
                        case 1: x = leftX + dx + af; z = yFront; break;
                        case 6: x = leftX - dx - ab; z = yBack; break;
                        case 7: x = leftX + dx - ab; z = yBack; break;
                        default:
                            x = leftX + af;
                            z = (yFront + yBack) * 0.5f;
                            break;
                    }
                    break;
                case "b":
                    switch (slot)
                    {
                        case 0: x = rightX + dx - af; z = yFront; break;
                        case 1: x = rightX - dx - af; z = yFront; break;
                        case 6: x = rightX + dx + ab; z = yBack; break;
                        case 7: x = rightX - dx + ab; z = yBack; break;
                        default:
                            x = rightX - af;
                            z = (yFront + yBack) * 0.5f;
                            break;
                    }
                    break;
                default:
                    x = 0;
                    z = 0;
                    break;
            }

            return new Vector3(x, 0f, z);
        }
    }
}

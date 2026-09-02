

## Scan geometry adaptation

The Scan API incorporates the reusable geometric idea from `ECJ Game Library`'s `GridMap` without importing its separate map state or event system. In addition to the default Manhattan-radius query, `ScanSystem` can enable an optional `visionCone: { angle }` and obtain the actor's facing through `getDirection`.

The vision cone uses the same grid convention as the library: `N`, `E`, `S` and `W`, with north as zero degrees and clockwise angles. Missing facing is reported as `scan.blocked` with reason `no-facing`, instead of spending a cost or silently producing an incorrect result. Line-of-sight occlusion is intentionally not included yet; it should be added later as another consumer-supplied visibility strategy when map cell semantics are defined.

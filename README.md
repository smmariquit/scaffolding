# scaffolding

## Engine Benchmark Snapshot

Comparison across three prototype branches for the CRT animation engine.

| Variant | Branch | Commit | Engine Dependency | `sceneManager.js` LOC | `sceneManager.js` Size (bytes) | Import Lines | Scene Files Count | Scene Files Total LOC |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Three.js baseline | `backup/threejs-crt` | `30b8f09` | `three@^0.164.1` | 135 | 4455 | 7 | 6 | 727 |
| Babylon.js CRT | `experiment/babylon-crt` | `d19f51a` | `@babylonjs/core@^7.42.0` | 284 | 10582 | 1 | 6 | 727 |
| p5.js CRT | `experiment/p5-crt` | `c7379a3` | `p5@^1.9.4` | 236 | 6405 | 1 | 6 | 727 |

### Notes

- Runtime benchmarks (FPS, frame time, memory, and built bundle output sizes) were not captured in this shell because Node/npm execution was unavailable.
- This table reflects static repository metrics extracted from each branch tip.

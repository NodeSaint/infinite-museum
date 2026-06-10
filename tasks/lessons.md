# tasks/lessons.md — patterns learned on this project

## Module init order (TDZ) with side-effect registries
A registry whose entries register via hoisted side-effect imports must live in its OWN module.
`import './flowfield'` at the bottom of `index.ts` is hoisted above `const registry = …`, so the
import's top-level `registerSystem()` ran in the registry's temporal dead zone. Fix: `art/registry.ts`
holds the Map; `index.ts` and every system import from it. **Rule:** never place a `const` that
imported modules touch at import-time in the same file that imports them for side effects.

## Apply spawn orientation, don't just compute it
`spawn.yaw` was computed in the room builder but never pushed to the controls, so the camera kept its
default heading and faced a blank wall — looked like "nothing renders". **Rule:** when a value exists
to drive state, assert it actually reaches that state (here: `controls.setYaw(spawn.yaw)`), and prove
it with a screenshot, not just a build pass.

## Trigger zones vs spawn points
Placing a teleport door on the wall the player spawns against caused an instant re-teleport (spawn was
inside the trigger radius). **Rule:** keep interactive trigger zones clear of spawn points, and add a
short post-spawn cooldown for anything that fires on proximity.

## Don't drive correctness-critical timing with setTimeout
A room transition that depended on a chain of `setTimeout`s could stall (headless Chrome throttles
timers aggressively even with `--disable-background-timer-throttling`, and real tabs throttle when
backgrounded). A stalled timer left `transitioning = true` and soft-locked the whole museum — the
room changed once, then froze. **Rule:** drive transitions/animations from the `requestAnimationFrame`
render loop (tick a countdown by `dt`), not `setTimeout`. rAF is reliable while the page draws and
pauses when hidden — which is exactly when no one is navigating. Keep an unlock in the same tick that
performs the swap so the lock can never outlive the transition.

## Verify WebGL apps in a real browser
`tsc` + `vite build` passing says nothing about runtime WebGL/DOM behaviour. A headless Chrome
(playwright-core pointed at the system Chrome, swiftshader GL) catching `pageerror`/`console.error`
found the TDZ crash that the type system could not. **Rule:** for graphical apps, a headless smoke
test that boots the app and asserts zero console errors is part of "done".

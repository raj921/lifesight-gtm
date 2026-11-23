# Gates: Lifesight GTM engine take-home

OWNS: app/**, components/**, lib/**, scripts/**, README.md, GATES.md

Scope: A working signal-led GTM prototype (scoring, why-now, committee, cited AI drafts, inbound event that changes the action) plus architecture page and 5-slide deck.

- [x] G1: Scoring, inbound qualification and draft guard behave as designed, and a simulated inbound event moves a dormant account up a tier and changes its next action
  CHECK: node lib/engine.test.ts
  EXPECT: engine checks passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/rajkumar/lifesight-gtm; path=5afcfbcbba9e/46 entries; EXPECT=matched; output-sha256=273fd91fc81e482391923eb72afcb21622001078f4b1db5a7778b65ebeef84a1; output-bytes=21

- [x] G2: Production build compiles with no type errors
  CHECK: pnpm build && echo build-ok
  EXPECT: build-ok
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/rajkumar/lifesight-gtm; path=5afcfbcbba9e/46 entries; EXPECT=matched; output-sha256=1570be7bed2318642d8e2a5b2595ced6c2fb9c57cdeffab43f760ac415dff558; output-bytes=1139

- [x] G3: Live draft API returns a DeepSeek draft whose every citation maps to a real signal (dev server on :3000)
  CHECK: node scripts/check-api.mjs
  EXPECT: api check passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/rajkumar/lifesight-gtm; path=5afcfbcbba9e/46 entries; EXPECT=matched; output-sha256=6b55edcf2c49bf6b117102b89e3b268587b6201b07d40d9b93fca165e2ddac50; output-bytes=462

- [x] G4: The DeepSeek key file is not tracked by git
  CHECK: node scripts/check-secret.mjs
  EXPECT: secret not tracked
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/rajkumar/lifesight-gtm; path=5afcfbcbba9e/46 entries; EXPECT=matched; output-sha256=aaf2f6e9a8f2773f5876345b854e377a80e06304168e09b5c726a9cb9f421752; output-bytes=19

- [x] G5: Dashboard, inbound simulation, architecture page and 5-slide deck render and work in the browser, light and dark
  EVIDENCE: 2026-11-23 built-in browser: / fired Halcyon preset → #16→#4, T3→T1, play changed; Draft email returned deepseek-flash draft, fact-check passed 4 claims; /architecture diagram renders; /deck slides 1-5 viewed via arrow keys; light scheme emulated on /; console: no errors besides a pre-favicon 404 (favicon since added)

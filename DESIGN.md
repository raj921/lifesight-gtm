# DESIGN.md

How Signal Desk looks, so people and coding agents keep it consistent.

## Base

- Tokens come from the Interfere design system (design.interfere.com). Light and dark follow the OS. All colours live in `app/globals.css`; never hard-code a colour in a component.
- Surfaces, back to front: `shell` (page) → `container` (the big rounded panel) → `card` → `sunken` (wells inside cards).
- Text: `fg` for content, `fg2` for supporting text, `fg3` for labels and hints. Nothing else.
- Accent colours mean something. `hot` = act now. `warm` = timing, or act soon. `brand` (blue) = fit, links, sources. `good` = checks passed. Don't use them for decoration.

## Type

- Inter for UI. Newsreader (serif) for headlines and big numbers. Geist Mono for ranks, counts and micro-labels.
- Headlines are two-tone: the plain part in `fg`, the ending in serif italic `fg3`. Example: "Who to call *today.*"
- Micro-labels are mono, uppercase, wide tracking, `fg3`: `01 — ACCOUNTS`.

## Shape

- Radius: container 16px, card 12px, control 8px. A card inside a card sits 6px in, with a radius 6px smaller (concentric corners).
- Badges are grey pills with a coloured gem (Hot / Warm / Later). Tags are mono chips.
- Borders are 1px `line`. Use `line-strong` for one thing per screen: the next action.

## Motion

- Motion (motion.dev) for movement, NumberFlow for numbers. Rows slide to their new rank; numbers roll.
- Enter animations only. Content must never wait on an exit animation to appear.
- 150–250ms for UI, springs for layout. Respect reduced motion.

## Patterns

- One prompt bar for input, with ↳ suggestion chips under it. One click runs a suggestion.
- A live status pill with a green dot shows the data is current.
- A toast at the bottom confirms what changed ("Halcyon Beauty moved #16 → #4"), then leaves on its own.
- Copy is short and plain. No "leverage", "seamless", "unlock". A label is 1–3 words.

## Sources

The patterns above came from the design bookmarks: Interfere (tokens), Refero (DESIGN.md, ↳ chips), MotionSites and Inspora (atmosphere, two-tone headlines), ThreeUI and landing.love/HAOQI (mono labels, grid lines), CollectUI (live pill, floating dock), Variant (prompt bar, italic muted endings), Transitions.dev (concentric cards, toasts), DesEngs (serif italic emphasis), designengineer.tools (Motion, NumberFlow).

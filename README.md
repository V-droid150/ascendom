# Ascendom

**Naik setiap hari, kuasai kerajaanmu.** *(Rise every day, rule your kingdom.)*

A pixel-art, kingdom-themed habit tracker where your real habits power a
character that rises — and falls — through the ranks of a medieval kingdom.
Complete a quest, earn XP and gold, level up, and get promoted into a visibly
better outfit. Miss your scheduled habits and your HP drains; when it hits zero
your hero **falls**, losing a level and possibly their rank and armour with it.

Built with Expo (React Native) and TypeScript. Runs on Android, iOS, the web,
and installs as a PWA, from one codebase.

---

## Why the Fall matters

Most habit trackers only reward you. Streaks go up, badges unlock, and quitting
costs nothing — which is exactly why they stop working after week three.

Ascendom's one real consequence is the Fall. Miss your scheduled dailies and HP
drains. At zero, you lose a level, 10% of your gold, and if that drops you below
your rank's floor you are demoted — your hero visibly loses the armour they
earned. That threat is the entire design thesis, and most of the balance work
went into making it feel *dramatic* rather than *punishing*:

- **A three-day grace period** after onboarding, so nobody gets hit before they
  have a habit of opening the app.
- **One declared rest day** a week with no penalty.
- **Royal Shields** (bought with gold) that absorb a full day automatically.
- **A damage cap of 30/day** regardless of how many habits you missed — see
  [Game design notes](#game-design-notes) for why this one isn't in the spec.
- **A 7-day catch-up cap**: disappear for a month and only the last week counts.
- **At most one Fall per day**, with leftover damage discarded.

The penalty is also explained *before* the hero is created, on a screen the user
has to actively accept. Surprise is what makes a punishment feel unfair.

---

## Features

**The core loop**
- Habits as quests: dailies on a weekday schedule, plus one-time to-dos
- XP and gold by difficulty, with a streak multiplier (+10%/week, capped +50%)
- Six ranks from Peasant to King/Queen, each with a distinct pixel outfit
- Full undo of today's completions — XP, gold, stats, HP and streak

**Consequence**
- HP drain, the Fall, rank demotion, and the level-1 floor
- Deterministic day rollover with catch-up, grace, rest days and shields
- A Royal Chronicle heat-map of the last 30 days

**Depth**
- A weekly boss that takes damage from every completion, scaled by difficulty
  and doubled when the habit trains the stat it's weak to
- A kingdom you build with gold: Hut → House → Blacksmith → Tower → Castle
- Companions unlocked by 7/30/100-day streaks
- Bad habits you log honestly, which cost HP but never gold or XP

**Craft**
- Every sprite generated from code — no art pipeline, no asset bottleneck
- Indonesian and English throughout, Indonesian by default
- Offline-first: no backend, no account, no network required
- Installable PWA with a Workbox service worker
- Dev-only sprite lab and in-app time travel for testing the Fall

---

## Screenshots

Run `npm run web` and visit `/dev/sprites` for the sprite lab, which previews
every gender × rank × skin × hair combination.

| | |
|---|---|
| Welcome | A pixel castle at night, generated from a character grid |
| Quests | Hero status strip, weekly boss, today's quests |
| Hero | Animated sprite, rank banner, stat diamond, Royal Chronicle |
| Sprite lab | All 1,728 appearance combinations |

---

## Architecture

```
app/                    expo-router screens
├─ (onboarding)/        welcome → gender → customise → quests → penalty
├─ (tabs)/              quests, hero, kingdom, shop, settings
├─ quest/[id].tsx       create and edit
├─ dev/sprites.tsx      sprite lab
└─ +html.tsx            web shell: manifest, theme, service worker

src/
├─ engine/              PURE game logic — no React, Expo, store or clock
├─ sprites/             palette, layers, compose, renderers
├─ store/               zustand, versioned persistence
├─ components/          PixelPanel, PixelButton, PixelBar, QuestCard, …
├─ hooks/               useHero, useTodayQuests, useDayRollover, …
├─ services/            storage adapter, clock, notifications, haptics, sound
├─ theme/               colour, spacing, typography tokens
└─ i18n/                id.json (default), en.json
```

### The engine is pure, and that's the whole point

`src/engine/` contains every rule in the game and imports nothing from React,
React Native, Expo, or the store — enforced by an ESLint `no-restricted-imports`
rule, not just by convention. It never reads the clock either: `todayKey` is
always injected by the caller.

That constraint is what makes the hard parts testable. `evaluateMissedDays` is a
pure function of `(hero, habits, logs, settings, todayKey)`, so "what happens if
a user with four habits disappears for nine days, two of which are rest days,
while holding one shield" is an ordinary unit test rather than a manual
experiment with the device clock.

```
332 tests, 15 suites
src/engine: 98.78% statements · 95.91% branches · 100% functions · 99.64% lines
```

The gate in `jest.config.js` fails the build below 90% on `src/engine/**`.

### Sprites are generated, not drawn

A 32×32 character is authored in source as `(column, pattern)` segments:

```ts
const MALE_BODY = layer({
  ...HEAD,
  14: row([11, 'ssssssssss']),
  ...rows(15, 19, row([9, 'lssssssssssssS'])),
  // s = skin, S = skin shade, l = skin highlight — swapped per hero
});
```

Layers compose in order — body → outfit → hair → headgear → cape → weapon — and
`s`/`r`/`c` characters resolve to a chosen skin, hair or cosmetic ramp at
composition time. That is the palette swap: there is **one** body per gender and
**one** art file per hairstyle, and six skin tones × eight hair colours fall out
of it for free. 2 genders × 6 ranks × 6 skins × 3 styles × 8 colours = **1,728
combinations from 34 pieces of art**, and a test renders every one of them.

Two details that mattered more than expected:

- **Rows are built, not typed.** Hand-padding 32-character strings with dots is
  silently wrong the moment a count is off by one. `row()` computes the padding
  and a test asserts every layer is 32×32 using only the documented alphabet.
- **Runs are merged.** A naive renderer emits one SVG rect per pixel — 1,024 per
  sprite, ~180,000 in the sprite lab. `compose()` collapses each row into
  horizontal runs, which brings a fully-dressed monarch down to ~250 rects.

`SpriteSource` is the seam: swapping generated grids for real PNG spritesheets
later means writing one more implementation, not touching any screen.

### State

One `gameStore` holds hero, habits, logs, chronicle and kingdom, because almost
every action spans several of them at once — completing a quest writes a log,
advances a streak, awards the hero, damages the boss and may unlock a companion.
Splitting those across four stores would make a logically atomic change into a
sequence of independent writes. Settings live separately since they are read
everywhere and never take part in a game transaction.

Persistence is versioned from the first commit and goes through a
`StorageAdapter` interface, so moving from AsyncStorage to SQLite or a synced
backend is a one-file change.

---

## Game design notes

**The XP curve.** `xpToNext(level) = round(30 + 12 × (level − 1)^1.25)`.
At a baseline of ~110 XP/day (about five medium habits with a small streak
bonus) this reaches level 5 in 1.9 days, level 10 in 8.4 days, level 30 in 99
days and level 45 in 248 days. Those four targets — a promotion on day two so
the reward loop lands immediately, Knight in a week, Lord/Lady in three months,
King/Queen in eight — are asserted as tests in `xp.test.ts`, so rebalancing the
curve can't silently break the pacing.

**Why damage is capped.** Miss damage is 10 HP per missed daily, which means a
user tracking ten habits takes 100 damage for the same bad day that costs a
minimalist 20 — while healing only scales at 3 HP per completion. Adding habits
shouldn't make the game harsher, so `MAX_DAILY_DAMAGE` caps a day at 30 (three
habits' worth). A full week of total neglect then costs exactly two levels rather
than seven, which is the intended worst case.

**Why protected days freeze streaks instead of advancing them.** A rest day or a
shielded day keeps your streak alive but doesn't increment it. Advancing it would
let a player buy streak progress with gold, and the streak multiplier is supposed
to measure consistency.

**Why the streak bonus counts the completion that earns it.** The multiplier uses
the streak a completion *produces*, so finishing a seventh consecutive day pays
the first +10% immediately rather than starting the day after. Slightly more
generous, considerably more satisfying.

**Why rank is derived.** Rank is computed from level everywhere and never stored.
A stored copy is a copy that can drift.

All tunable numbers live in `src/engine/constants.ts`; nothing else in the
codebase is allowed to hardcode a game number.

---

## Running it

Requires Node 20+.

```bash
npm install
npm run web        # browser
npm run android    # device or emulator
npm run ios        # macOS only
```

Quality gates:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run verify      # all of the above
```

Build the installable web app:

```bash
npm run build:web   # expo export + Workbox service worker into dist/
npm run icons       # regenerate app and PWA icons from pixel art
```

### Testing the Fall without waiting a week

Settings → *Alat Pengembang* → **Maju 1 hari** advances the in-app calendar and
re-runs the rollover. Because the engine takes `todayKey` as a parameter rather
than reading the clock, this is a real test of the production code path, not a
mock. Six taps with three habits reproduces the full sequence: grace days, 30/day
damage, and the Fall.

---

## Tech decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | Expo SDK 58 + TypeScript (strict) | One codebase for Android, iOS and web |
| Routing | expo-router | File-based, and gives real URLs on web |
| State | Zustand + persist | Small, no boilerplate, versioned migrations |
| Storage | AsyncStorage behind `StorageAdapter` | Swappable for SQLite or a backend |
| Rendering | react-native-svg | Pixel grids as merged rects, crisp at integer scale |
| Animation | Reanimated 4 | Runs on the UI thread; stepped easing suits pixel art |
| Dates | date-fns | Tree-shakeable, and one `dayKey()` owns all day logic |
| i18n | i18next + react-i18next | Indonesian default, English fallback |
| Testing | Jest + Testing Library | Coverage gate on the engine |
| Backend | none | The brief said not to over-engineer it, and the app is better offline-first |

Notable surprises while building:

- **Expo has no built-in PWA support any more.** `expo-pwa` and
  `expo build:web` are gone; the manifest is hand-written in `public/` and the
  service worker is generated by Workbox as a build step.
- **A custom `+html.tsx` must render `{headNodes}`.** That array carries the
  react-native-web stylesheet. Omitting it ships a page where every `View` falls
  back to `display: block` — the app collapses into the top-left corner and no
  fonts load, with no error anywhere.
- **Reanimated 4 needs `react-native-worklets`** as a separate package and is
  New-Architecture-only.
- **`shapeRendering="crispEdges"` is web-only.** On native, crispness comes from
  integer rect coordinates and an integer scale instead.
- **Celebrations have to be real modals.** An in-tree overlay unmounts on
  mouseup, and the browser delivers the trailing click to whatever is underneath
  — dismissing a level-up could toggle the quest card beneath it and undo the
  very completion being celebrated.

---

## Status

Phases 1–4 and 6 are complete: engine, sprites, the full app, the depth systems,
and this README. Phase 5 (Supabase auth and sync, guilds) was deliberately
skipped — the brief asked not to over-engineer the backend, and nothing in the
product needs one yet. The `StorageAdapter` seam is where it would go.

Not yet done:

- Deployed web build and an Android APK via EAS (both are configured but
  unpublished; iOS additionally needs a paid Apple Developer account)
- Sound effects on native. The web build synthesises its cues with the Web Audio
  API rather than shipping audio files, so native is silent until an audio
  dependency is approved.
- Lighthouse audit numbers

---

## Credits

- Palette: [Sweetie 16](https://lospec.com/palette-list/sweetie-16) by GrafxKid
- Fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and
  [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) via
  `@expo-google-fonts`
- Skin and hair ramps are hand-picked rather than taken from Sweetie 16, which
  contains no skin tones — forcing them into it produces grey or sunburnt heroes
- All sprites, icons and scenery are generated by code in this repository
- Sound cues are synthesised at runtime; no audio files are bundled

MIT licensed. See [LICENSE](./LICENSE).

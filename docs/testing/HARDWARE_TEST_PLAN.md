# TeclaLer Hardware Test Plan

This plan is for real-device testing of the five-word `pt-PT` starter lesson: `CASA`, `MALA`, `PATO`, `SAPO`, and `BOLA`.

The app must remain local-first during these tests. Do not sign in, enable analytics, connect cloud sync, grant microphone access, or add external services.

## Test Setup

- Start the dev server on the computer:

```bash
npm run dev
```

- For phones and tablets on the same local network, open the Vite network URL shown in the terminal, for example:

```text
http://192.168.x.x:5173/
```

- Keep device volume on because placeholder audio may use browser text-to-speech.
- Use a fresh browser tab when possible.

## Expected Results For Every Device

- The target word is always visible.
- Syllables stay visible.
- Typing boxes stay visible and update only after correct input.
- The current key remains clearly highlighted.
- Wrong keys do not fill a box or advance the lesson.
- Wrong-key feedback stays calm, for example `Precisamos da letra C.`
- `Apagar` and physical `Backspace` remove the most recent typed letter.
- Deleting after completion returns the word to incomplete state.
- Completing a word plays the full-word audio.
- `Ouvir outra vez` plays the current full word.
- `Próxima palavra` is disabled until the current word is complete.
- The final word shows a calm `Lição completa` state.
- No accounts, analytics, ads, external links, cloud sync, or microphone prompts appear.

## A. Desktop Browser With Physical Keyboard

| Step | Expected result | Tester notes |
| --- | --- | --- |
| Load the app. | `CASA` appears with `CA` and `SA`, empty typing boxes, and `C` highlighted. | |
| Complete `CASA` using the physical keyboard. | Each correct key fills one box and plays Portuguese audio; completion plays `casa`. | |
| Complete `MALA` using the physical keyboard. | Same learning loop works for `MALA`. | |
| Complete `PATO` using the physical keyboard. | Same learning loop works for `PATO`. | |
| Complete `SAPO` using the physical keyboard. | Same learning loop works for `SAPO`. | |
| Complete `BOLA` using the physical keyboard. | Completion shows `Lição completa`. | |
| Press a wrong key before the first letter. | The box stays empty and calm feedback appears. | |
| Use `Backspace` after partial input. | The most recent typed letter is removed and the current key moves back. | |
| Use `Backspace` after completion. | `Palavra completa` disappears and the last letter can be retyped. | |
| Press `Ouvir outra vez`. | The current full word audio plays. | |
| Check `Próxima palavra` before completion. | It is disabled. | |
| Move forward, then press `Anterior`. | The previous word appears without confusing stale typed letters. | |

## B. Android Chrome Touch Test

| Step | Expected result | Tester notes |
| --- | --- | --- |
| Load the app. | Layout fits the screen without horizontal scrolling. | |
| Complete all five words using only the on-screen keyboard. | Every visible key works and uses the same lesson state as physical input. | |
| Tap several letter buttons. | Buttons are large enough for child taps and do not accidentally zoom the page. | |
| Try horizontal panning. | No weird horizontal scrolling occurs. | |
| Use `Apagar` after partial input. | The previous letter is removed. | |
| Use `Apagar` after completion. | Completion rolls back and the deleted letter can be retyped. | |
| Press `Ouvir outra vez`. | Current word audio plays. | |
| Finish `BOLA`. | `Lição completa` appears calmly. | |

## C. iPad Safari Touch-Only Test

| Step | Expected result | Tester notes |
| --- | --- | --- |
| Load the app. | Word, syllables, typing boxes, replay, progress, navigation, and keyboard fit the screen. | |
| Tap around the lesson screen. | No unnecessary native keyboard appears. | |
| Complete all five words using touch only. | Every touch key advances only when correct and plays audio. | |
| Use `Apagar`. | Rollback works and current-key highlight updates. | |
| Press `Ouvir outra vez`. | Current word audio plays. | |
| Move between words. | `Anterior` and `Próxima palavra` do not cause layout jumping or stale state. | |
| Rotate the iPad if practical. | Layout remains usable without horizontal scrolling. | |

## D. iPad Safari With Physical Keyboard

| Step | Expected result | Tester notes |
| --- | --- | --- |
| Load the app. | The page accepts keyboard input without needing a hidden text field. | |
| Complete all five words using the physical keyboard. | Correct keys advance, audio plays, and each word completes normally. | |
| Use physical `Backspace`. | The most recent typed letter is removed. | |
| Press a wrong key. | Calm feedback appears and the lesson does not advance. | |
| Press on-screen buttons, then type on the physical keyboard. | Focus is not lost; physical keyboard input still works. | |
| Press `Ouvir outra vez`, then type. | Replay works and physical keyboard input still works afterwards. | |
| Use `Próxima palavra` and `Anterior`, then type. | Navigation works and focus returns to the learning area. | |

## E. iPhone Safari If Practical

| Step | Expected result | Tester notes |
| --- | --- | --- |
| Load the app at phone width. | Interface remains usable with no horizontal scrolling. | |
| Confirm the keyboard is usable. | Tap targets are not tiny; rows may wrap instead of shrinking too far. | |
| Complete at least `CASA` and `MALA`. | Touch input, audio, completion, and navigation work. | |
| Use `Apagar`. | Rollback works. | |
| Press `Ouvir outra vez`. | Current word audio plays. | |
| Watch for accidental zoom or text selection. | Neither should happen during normal key taps. | |

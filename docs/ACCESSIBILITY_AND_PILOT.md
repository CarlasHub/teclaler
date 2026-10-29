# Accessibility and supervised child pilot

## Automated checks completed

- Unit tests exercise physical and on-screen typing, focus return, stage changes, local resume, modal keyboard blocking and Escape.
- Real Edge browser tests exercise a full word with the physical keyboard, Tab order, modal focus, Shift+Tab, Escape, and the visible completion action at narrow mobile sizes.
- Browser tests check 12 viewport sizes, including narrow phones and iPad-sized portrait and landscape layouts. They check that the target, typing position and touch keyboard remain visible together, that touch keys are large enough, that accent keys fit, and that opening a lesson resets scroll.
- Pull requests and Pages deployment run the browser tests in Chromium and WebKit. A production-build test checks the Pages path, the self-contained app entry, offline reload, cached audio and moving to the next word.
- axe-core checks the lesson and settings for automated WCAG 2.0, 2.1 and 2.2 A/AA violations. Automated checks are useful but do not prove screen-reader usability.
- The layout has visible focus, a 44 px minimum on-screen key height at compact desktop sizes, and a reduced-motion rule.

## Human checks before a child pilot

1. A Portuguese Year 1 educator reviews each added word, stage order, syllable split and suitability for the intended learners. Correct `src/curriculum/ptPTYearOnePack.ts` and change review statuses only after approval.
2. A pt-PT speaker listens to every generated word, syllable and partial-word recording. Replace unclear or unnatural clips and mark approved assets in `src/audio/manifest.ts`. Run `npm run validate:content -- --release` and resolve every finding.
3. Test with NVDA and Firefox or Edge, then with JAWS and Edge if available. Verify that target word, current position, typed letter, wrong-key feedback, stage, progress and completion are announced in a useful order. Complete CASA using the on-screen keys and check that focus reaches **Próxima palavra** and that MALA and its position are announced after advancing. Complete BOLA both with and without earlier words: only a fully practised stage should announce completion. Test Tab, Shift+Tab, Enter, Space, Escape, selector arrows, volume arrows and Backspace. Confirm there is no keyboard trap or focus loss.
   Repeat with automatic advancement on and off; confirm that the new word is announced after the finished word audio, and that the setting can be reached and changed without losing the current word.
4. Check 200% and 400% zoom, high contrast/forced colors, reduced motion and narrow windows. Keep the target word visible while typing with the on-screen keyboard.
5. Ask an adult to supervise child testing. Observe whether children can understand the instructions and make progress without hints, whether audio timing is helpful, and whether corrections feel calm. Do not collect names, recordings or analytics. Record only anonymous observations and proposed fixes.

These are release gates. Completing the build and automated checks does **not** count as educator, screen-reader or child testing.

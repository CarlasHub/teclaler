# Accessibility and QA

## Accessibility target

Aim for WCAG 2.2 AA where applicable.

## Accessibility requirements

- Large text.
- Strong contrast.
- No colour-only meaning.
- Visible focus states.
- Keyboard access.
- Touch targets at least child-usable size.
- Replay audio.
- Reduced motion support.
- No time pressure by default.

## Required tests

### Unit

- input normalisation,
- lesson state transitions,
- syllable completion,
- word completion,
- audio manifest resolution,
- progress aggregation.

### Component

- lesson screen,
- on-screen keyboard,
- replay button,
- progress summary.

### End-to-end

- complete `casa` with physical keyboard,
- complete `casa` with on-screen keyboard,
- wrong key does not advance,
- replay button works,
- offline PWA loads.

### Manual device matrix

| Device/platform | Test |
|---|---|
| Desktop Chrome | physical keyboard, audio |
| Desktop Safari | audio, layout |
| Android Chrome | touch keyboard, PWA |
| iPhone Safari | audio, layout |
| iPad Safari | external keyboard, touch |

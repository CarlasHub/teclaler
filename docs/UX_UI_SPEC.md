# UX/UI Specification

## Reference image

Use:

```text
assets/design/teclaler_app_interface_for_learning.png
```

## Main lesson screen

Must show:

- app name `TeclaLer`,
- subtitle `Ouve. Lê. Escreve.`,
- optional meaning image,
- large target word,
- syllable split,
- typed-letter boxes,
- current audio cue,
- replay button,
- custom Portuguese keyboard,
- progress indicator.

## Desktop/tablet layout

```text
┌───────────────────────────────────────────────┐
│ TeclaLer                                      │
│ Ouve. Lê. Escreve.                            │
├───────────────────────────────────────────────┤
│ [image]     CASA                              │
│             CA       SA                       │
│             [C] [A] [S] [_]                   │
│             🔊 Ouves: “cê”                    │
│             [Ouvir outra vez]                 │
├───────────────────────────────────────────────┤
│ Q W E R T Y U I O P                           │
│ A S D F G H J K L Ç                           │
│ Z X C V B N M                                 │
└───────────────────────────────────────────────┘
```

## Design rules

- Target word is the largest element.
- Current key is highlighted.
- Typed letters are clear.
- Audio feedback is visible and audible.
- Replay is always available.
- Avoid noisy animations.
- No ads or unrelated UI.
- No external links in child mode.

## Keyboard

MVP keys:

```text
Q W E R T Y U I O P
A S D F G H J K L Ç
Z X C V B N M
space
backspace
```

Accent row when needed:

```text
Á É Í Ó Ú Â Ê Ô Ã Õ
```

# Product Requirements

## Product

**Name:** TeclaLer  
**Subtitle:** Ouve. Lê. Escreve.

## Problem

Children learning Portuguese need a calm, structured way to connect text, keyboarding, and sound. Most typing apps teach speed. Many reading apps bury reading under games. TeclaLer focuses on the learning loop itself.

## Core interaction

```text
Target: CASA
Syllables: CA | SA
Student types: C A S A
Audio:
- C → "cê"
- A → "a"
- CA → "ca"
- S → "esse"
- A → "a"
- CASA complete → "casa"
```

## MVP requirements

### FR-001 Target text

The app shall always show the target word or sentence during the lesson.

### FR-002 Typed letter boxes

The app shall show each typed letter in visible boxes.

### FR-003 Physical keyboard

The app shall support desktop/laptop keyboard input.

### FR-004 Custom on-screen keyboard

The app shall provide its own Portuguese keyboard for mobile/tablet child mode.

### FR-005 Key audio

The app shall read the accepted key/letter/sound in Portuguese.

### FR-006 Syllable audio

The app shall read completed syllables in phonics activities or manual replay
when configured. The typing lesson shall not insert syllable audio into the
accepted-letter → completed-word sequence.

### FR-007 Completed word audio

The app shall read the complete word when the final correct key is pressed.

### FR-008 Replay

The app shall provide an audio replay button.

### FR-009 Local progress

The app shall store local progress for letters, syllables, and words.

### FR-010 Parent/teacher progress

The app shall show a simple progress summary outside child mode.

## Non-functional requirements

- Works on desktop, tablet, Android Chrome, iOS Safari.
- Designed as PWA.
- Offline-ready for lesson packs.
- Low distraction.
- Accessible.
- Child-safe.
- No tracking in MVP.

## MVP success criteria

A child can complete 20 starter words using either keyboard mode and receives correct Portuguese audio at key, syllable, and word completion stages.

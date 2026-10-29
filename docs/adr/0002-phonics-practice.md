# ADR 0002: Keep phonics practice separate from the typing engine

The Phonics view uses the same curriculum items, local syllable and word recordings, and illustration as the typing lesson. A small framework-independent engine tracks which syllable comes next and when blending is available. The React screen handles presentation and focus; the app handles audio playback and navigation.

This keeps phonological practice independent of typed-word progress. Hearing syllables does not mark a word complete; a child moves to the existing lesson to type it. The dedicated view uses the current stage and word, so navigation between the two modes does not introduce a second curriculum or cloud state.

The current recordings provide syllables and whole words. Isolated grapheme or phoneme audio is outside this decision until reviewed recordings exist for each language.

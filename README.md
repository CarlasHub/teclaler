# TeclaLer

TeclaLer helps children practise reading and typing. A child sees a word, types each letter on a physical or on-screen keyboard, and hears letters, syllables and the completed word. The interface has no accounts, advertising, tracking, microphone access or external links in the lesson.

**Web app:** https://carlashub.github.io/teclaler/

**Windows app:** the latest successful [Build Windows app](https://github.com/CarlasHub/teclaler/actions/workflows/windows.yml) run contains an NSIS installer artifact.

## What's in the app

- European Portuguese: 56 original words across four stages, each with a local illustration and description, from starter words to short words, accents and digraphs. The 51 added practice words and their locally generated pt-PT recordings are drafts requiring educator and pronunciation review before a child pilot. Illustration credits are in [Word illustrations](public/images/WORD_ILLUSTRATIONS.md).
- Brazilian Portuguese and British English: separate five-word starter lessons with their own audio IDs.
- Each language uses one controlled local recording voice for words, sound parts, letters and feedback: separate synthetic Qwen3-TTS literacy voices for European and Brazilian Portuguese, and female Cori for UK English. The recordings remain marked for native-speaker pronunciation review.
- Physical and on-screen keyboard input; visible focus; keyboard-operable language, stage, sound and settings controls; local resume and progress.
- A simple home screen lets a child resume the last word or choose a stage using a large icon and label. Each stage shows progress on this device. The layout adapts to iPad portrait, landscape and split windows.
- A dedicated **Treinar sons / Phonics** section lets a child hear each recorded syllable in order, blend the whole word, see its letter groups, and then type that same word. It covers every word in the chosen language and opens from Home or the lesson settings.
- A versioned offline web cache; the Windows app embeds the same lessons and audio locally.

## Run locally

```powershell
npm ci
npm run dev
```

Open `http://localhost:5173/`. For the Windows app, see [Windows setup](docs/WINDOWS_APP.md). The older testing machine has WebView2 but lacks the heavy Rust and MSVC build tools, so GitHub Actions builds its installer.

## Check a change

```powershell
npm run qa
npm audit
```

`qa` checks unit behaviour, curriculum/audio, the Pages build, browser accessibility and touch layouts, and offline use. It writes a short pass/fail report to `.qa/report.json`. It uses the installed Edge browser on Windows; pull requests and Pages deployment also test WebKit. See [QA checks](docs/QA.md) for the scope and limits. `validate:content -- --release` intentionally fails until all child-facing audio is reviewed and approved in the manifest.

Portuguese audio is generated locally with the free Apache-2.0 Qwen3-TTS models and synthetic regional reference voices; it does not clone a real speaker. Install `scripts/requirements-audio.txt`, set `QWEN_TTS_PYTHON` to that Python environment, then run `npm run audio:generate-pt-pt` or `npm run audio:generate-pt-br`.

## Keyboard use

- On the home screen, choose a language and start or resume a stage. Use the **Etapas** button to return there from a lesson.
- Choose **Treinar sons** on Home to practise sound parts. The Phonics screen has its own stage selector and previous/next word arrows. Touch, `Tab`, `Enter` and `Space` operate its buttons.
- Use **Ouvir palavra** to hear the full word at any time. Type the visible word with the physical keyboard or use the on-screen keys.
- Use **Recomeçar palavra** to clear your current attempt. The arrows beside the word move to the previous or next word. Moving forward before finishing skips that word without marking it complete.
- The on-screen keyboard stays visible while typing and after a word is complete. After the finished word is spoken, the next word appears automatically. The **Próxima palavra** action and arrows still allow immediate movement. At the end of a stage, the app offers the next stage or unfinished words.
- On narrow screens the keyboard uses larger touch keys and the stage choice stays on the home screen via **Etapas**. The page returns to the top when a new word or stage opens.
- **Definições** contains sound volume and a switch to pause automatic advancement; the lesson keeps a compact row for hearing, replaying and restarting the word.
- `Backspace` removes the last typed letter. `Enter` advances after a completed word.
- `Tab` reaches every control. `Enter` or `Space` activates buttons; arrow keys operate native selectors and sound controls.
- Settings keeps focus inside the dialog. `Escape` closes it and returns focus to the settings button.

## Review and privacy

The [five-manual public-source research](docs/MANUAL_RESEARCH_2026.md) records what was accessible without copying textbook content. [Accessibility and child pilot checks](docs/ACCESSIBILITY_AND_PILOT.md) describe the remaining human checks. [Offline deployment](docs/OFFLINE_AND_DEPLOYMENT.md) explains the Pages build and cache. Product and privacy rules remain in [AGENTS.md](AGENTS.md) and [docs/PRIVACY_CHILD_SAFETY.md](docs/PRIVACY_CHILD_SAFETY.md).

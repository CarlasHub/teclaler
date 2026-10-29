# TeclaLer

TeclaLer helps children practise reading and typing. A child sees a word, types each letter on a physical or on-screen keyboard, and hears letters, syllables and the completed word. The interface has no accounts, advertising, tracking, microphone access or external links in the lesson.

**Web app:** https://carlashub.github.io/teclaler/

**Windows app:** the latest successful [Build Windows app](https://github.com/CarlasHub/teclaler/actions/workflows/windows.yml) run contains an NSIS installer artifact.

## What's in the app

- European Portuguese: 56 original words across four stages, from image-supported starter words to short words, accents and digraphs. The 51 added practice words and their locally generated pt-PT recordings are drafts requiring educator and pronunciation review before a child pilot.
- Brazilian Portuguese and British English: separate five-word starter lessons with their own audio IDs.
- Physical and on-screen keyboard input; visible focus; keyboard-operable language, stage, sound and settings controls; local resume and progress.
- A home screen lets a child resume the last word or choose any stage. Each stage shows its word count, examples and progress on this device.
- A versioned offline web cache; the Windows app embeds the same lessons and audio locally.

## Run locally

```powershell
npm ci
npm run dev
```

Open `http://localhost:5173/`. For the Windows app, see [Windows setup](docs/WINDOWS_APP.md). The older testing machine has WebView2 but lacks the heavy Rust and MSVC build tools, so GitHub Actions builds its installer.

## Check a change

```powershell
npm test
npm run test:e2e
npm run validate:content
npm run build
npm audit
```

`test:e2e` uses the installed Edge browser on Windows. On Linux CI, the Pages workflow installs Chromium. `validate:content -- --release` intentionally fails until all child-facing audio is reviewed and approved in the manifest.

## Keyboard use

- On the home screen, choose a language and start or resume a stage. Use the **Etapas** button to return there from a lesson.
- Use **Ouvir palavra** to hear the full word at any time. Type the visible word with the physical keyboard or use the on-screen keys.
- Use **Recomeçar palavra** to clear your current attempt or **Tentar outra palavra** to move on without marking an unfinished word complete.
- After completing a word, the on-screen keys become a clear **Próxima palavra** action; `Enter`, `Space` or a click activates it. At the end of a stage, the action leads to the next stage or to any unfinished words.
- `Backspace` removes the last typed letter. `Enter` advances after a completed word.
- `Tab` reaches every control. `Enter` or `Space` activates buttons; arrow keys operate native selectors and sound controls.
- Settings keeps focus inside the dialog. `Escape` closes it and returns focus to the settings button.

## Review and privacy

The [five-manual public-source research](docs/MANUAL_RESEARCH_2026.md) records what was accessible without copying textbook content. [Accessibility and child pilot checks](docs/ACCESSIBILITY_AND_PILOT.md) describe the remaining human checks. [Offline deployment](docs/OFFLINE_AND_DEPLOYMENT.md) explains the Pages build and cache. Product and privacy rules remain in [AGENTS.md](AGENTS.md) and [docs/PRIVACY_CHILD_SAFETY.md](docs/PRIVACY_CHILD_SAFETY.md).

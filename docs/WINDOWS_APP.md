# Windows app

TeclaLer uses the same React lesson code in the browser and in a Tauri 2 desktop window. The Windows app embeds the web build, so lessons and audio work without an internet connection. It stores progress in WebView2 local storage on this device. No account, microphone or cloud permission is used.

The [Build Windows app workflow](../.github/workflows/windows.yml) produces an NSIS `TeclaLer-Windows-Installer` artifact after testing the code and validating the curriculum. Download the artifact from the latest successful workflow run on GitHub Actions. It is an unsigned development installer; a signed public release would require a code-signing certificate and a separate review.

To build on a Windows development machine, install the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/) (Rust, Microsoft C++ Build Tools and WebView2), then run:

```powershell
npm ci
npm run tauri:dev
npm run tauri:build
```

The installer is written to `src-tauri/target/release/bundle/nsis/`. Building the installer on the GitHub Windows runner avoids installing the Rust and C++ toolchains on the older test computer.

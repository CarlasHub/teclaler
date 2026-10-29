# QA checks

Run `npm run qa` in the repository. The runner prints one short PASS or FAIL line per check, saves `.qa/report.json`, and exits with a failure code if any check fails. In GitHub Actions it adds a summary table and a failure annotation. The report artifact keeps the JSON report and Playwright failure details.

| Check | What it catches |
| --- | --- |
| Unit behavior | Regressions in lesson progression, keyboard input, focus, settings and local progress |
| Curriculum and audio | Missing, mismatched or malformed lesson and recording data |
| Pages production build | TypeScript/build errors and failures while preparing the self-contained Pages entry and offline cache |
| Browser, touch and accessibility | Core lesson flows, keyboard navigation, axe checks, touch input, 12 screen sizes and visible keyboard/target geometry |
| Production page and offline use | Pages subpath, app load, offline reload, cached audio and next-word navigation in the built app |

Pull requests run the gate in Chromium and WebKit. The same gate runs before Pages deployment; a failure prevents that deployment. Windows builds have their own unit, content and installer checks.

The checks flag reproducible failures. They cannot judge pronunciation, child comprehension or real assistive-technology announcements. A Portuguese educator and speaker, JAWS and NVDA users, and a supervised child pilot must complete the [human checks](ACCESSIBILITY_AND_PILOT.md) before calling the lessons ready for children.

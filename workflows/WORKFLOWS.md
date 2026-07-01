# Workflows

## Feature delivery

```mermaid
flowchart LR
  A[Idea] --> B[Feature spec]
  B --> C[Risk review]
  C --> D{ADR needed?}
  D -- yes --> E[Write ADR]
  D -- no --> F[Build]
  E --> F
  F --> G[Tests]
  G --> H[Review]
  H --> I[Release checklist]
```

## Content release

```mermaid
flowchart LR
  Draft --> PedagogyReview --> PronunciationReview --> AudioReview --> Validation --> Release
```

## Audio release

```text
script list → record/generate source → export → add manifest → review → validate → device test → release
```

## Privacy review

```text
change proposed → data map → risk level → DPIA-lite if needed → mitigation → approval/hold
```

## Incident response

```text
stop release → classify → fix/remove → test → legal/privacy review if needed → release patch → regression test
```

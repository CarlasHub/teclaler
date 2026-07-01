# Privacy and Child Safety

## Legal note

This is a governance baseline, not legal advice. Get legal review before public/school launch, because apparently good intentions do not count as compliance.

## MVP privacy model

```text
local-first
no account
no cloud sync
no third-party analytics
no ads
no child full name required
no voice recording
```

## Allowed local data

- profile ID,
- optional nickname/avatar,
- lesson ID,
- item ID,
- correct/incorrect attempt,
- grapheme needing practice,
- completion timestamp.

## Avoid

- full legal name,
- date of birth,
- child email,
- precise location,
- voice recordings,
- camera images,
- contacts,
- advertising IDs,
- raw free-form text.

## Child mode restrictions

Child mode must not show:

- external links,
- settings requiring adult judgement,
- legal pages,
- account management,
- purchases,
- social sharing,
- public rankings.

## Data review triggers

Run DPIA-lite before adding:

- cloud sync,
- accounts,
- teacher dashboards,
- analytics,
- payments,
- third-party SDKs,
- AI-generated child-facing content,
- audio recording.

## Portugal/EU baseline

Plan around GDPR and Portuguese child consent rules. Portugal's Law No. 58/2019 sets the age for direct information society service consent at 13; below 13, legal representative consent is required where consent is the basis. Verify with legal counsel before cloud/account features.

## UK baseline

If likely accessed by UK children, review the ICO Children’s Code / Age Appropriate Design Code.

## Safety acceptance criteria

- No ads.
- No tracking SDKs.
- No external links in child mode.
- No account required.
- Reset local progress available.
- Parent/teacher mode separated from child mode.

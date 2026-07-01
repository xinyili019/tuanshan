# European Portuguese A1 + A2 Vocabulary Trainer

Browser-based vocabulary practice app for beginner European Portuguese, organized by `Módulo`.

The app uses the reviewed extracted vocabulary in `src/data/vocabulary.ts`. The original workbook PDF is not required to run, test, or deploy the app.

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm test
npm run validate:data
npm run build
npm run e2e
```

## Vocabulary data

Curated source fragments live in `src/data/fragments/`. To regenerate the app dataset after editing those fragments, run:

```bash
npm run merge:vocab
npm run validate:data
```

PDF files and raw extraction drafts are intentionally ignored because the reviewed vocabulary has already been extracted into the repository.

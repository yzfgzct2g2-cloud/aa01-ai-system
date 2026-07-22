# Phase 4-1 Step 1 Basic Data Design

## Scope

Phase 4-1 changes only the Step 1 assessment date, CMS level, and identity
category controls. It does not change Step 3, Step 4, the IndexedDB schema,
draft startup/recovery behavior, or any later Checkpoint 4 phase.

The baseline is `c803a36be44f9c5a9a415d59cae9bebd8894eee6` on `main`, version
`1.6.5`, with 161 passing tests. The pre-existing unstaged `package.json`
change from `vite` to `vite --host` is outside this phase and must remain
unstaged and uncommitted.

## Existing Data Flow

`App.tsx` owns one `AA01Form` object. `Step1Basic.tsx` currently writes all
three fields as unrestricted strings. `useDraftSession` observes the whole
form, stores it in the existing schema-1 `LocalDraft`, and hydrates the same
form object when the user explicitly continues a draft. The draft migration
layer clones the form without changing these fields. `aa01Generator.ts`
currently prints the three stored strings directly.

Consequently, old drafts may contain arbitrary text. A native date or select
control cannot safely display every historic value, and normalizing during
render or hydration would cause an unsolicited autosave and overwrite.

## Selected Design

### Compatibility boundary

Add pure resolvers in `src/Components/Step1Basic.logic.ts`:

- `resolveLegacyAssessmentDate(value)`
- `resolveLegacyCmsLevel(value)`
- `resolveLegacyIdentityType(value)`

Each returns a new result object containing `normalizedValue`,
`originalValue`, `isValid`, `isLegacy`, and `needsUserSelection`. The helpers
never mutate their input, React state, or IndexedDB.

An empty value resolves to an empty valid control value. A canonical value
resolves unchanged. A recognized legacy value resolves to a canonical display
value without writing it back. An unknown non-empty value resolves to an empty
control value while retaining its displayable original value and setting
`needsUserSelection`.

### Date rules

The controlled Step 1 date field becomes `input type="date"`. New changes are
stored as `YYYY-MM-DD`.

Safe recognition includes:

- a valid `YYYY-MM-DD`;
- a valid `YYYY/M/D`;
- an ISO timestamp with an explicit leading `YYYY-MM-DD` date;
- a complete, valid ROC date explicitly marked with `民國`, or a complete
  `NNN年M月D日` ROC date.

Validation compares the reconstructed year, month, and day, so invalid leap
days and impossible month/day combinations do not normalize. Ambiguous text
such as `今天` or `七月二日` remains untouched and requires selection.

### CMS rules

The controlled CMS field becomes a native select whose only non-placeholder
values are the strings `"2"` through `"8"`, displayed as `2級` through `8級`.
The resolver accepts exact safe variants using Arabic or Chinese level
numbers, including `4級`, `CMS 4級`, `第四級`, and `CMS第四級`. Values outside
2–8 and unrelated text remain untouched and require selection.

### Identity rules

Add `src/data/identityOptions.ts` as the shared Phase 4-1/Phase 4-3 source of
truth. Canonical stored values are `class1`, `class2`, and `class3`; displayed
and generated labels are `第一類`, `第二類`, and `第三類`.

The identity resolver recognizes only the approved exact aliases:

- `class1`: `第一類`, `第一類／低收`, `第一類/低收`, `低收入戶`, `低收`
- `class2`: `第二類`, `第二類／中低收`, `第二類/中低收`, `中低收入戶`, `中低收`
- `class3`: `第三類`, `第三類／一般戶`, `第三類/一般戶`, `一般戶`

Step 1 uses the shared option list. Step 4 is not changed in this phase.
AA01 generation uses the shared label formatter so canonical keys never leak
into output. Recognized legacy aliases also render as their canonical label;
unknown legacy strings continue to render unchanged until the user chooses a
canonical value.

### Unknown legacy values

For an unknown non-empty value, the native control shows its empty
placeholder. Directly below it, the page displays:

```text
偵測到舊資料：{原始值}
請重新選擇
```

The stored form remains unchanged. Choosing a valid new value invokes the
existing `setForm` path, replaces only that field, removes the warning on the
next render, and lets the existing autosave behavior persist the change.

## Persistence and Compatibility

- No IndexedDB or `LocalDraft` schema change.
- No batch migration and no compatibility-triggered write during
  hydration/render. The existing continue flow may update `lastOpenedAt`; any
  such metadata save must carry the original three field values byte-for-byte
  and must not persist display normalization.
- Old and empty drafts remain loadable.
- Resolvers are view compatibility only; raw data survives until a user edit.
- Date changes already save immediately. CMS and identity are removed from
  the free-text debounce set so their new select changes also save
  immediately through the existing `classifyFormChange` and save queue.
- No later Step 1 fields or nested Step 3/Step 4 data are reconstructed or
  removed by an update.

## Verification

Focused tests cover resolver purity, valid and invalid date variants, CMS
variants and boundaries, identity aliases, native control markup, legacy
warnings, user replacement, no render-time write, autosave/recovery, data
preservation, and AA01 labels. Completion also requires the full test suite,
lint, production build, `git diff --check`, desktop/mobile browser checks, one
commit named `feat: improve step 1 basic data inputs`, and push to
`origin/main`.

# Visio text editing fixtures

These small synthetic VSDX files contain no user data. They start from
`createVsdx()` plus a single text box created by `editVsdx()` in ooxml-core 1.22.0.
The ZIP page XML adds standard Visio text markers to exercise native editor paths:

- `visio-single-run.vsdx`: one parsed text run with `cp` and `pp` markers.
- `visio-stencil-local.vsdx`: that formatted text on an instance of a test master.
- `visio-multi-run.vsdx`: two character runs, the second bold.
- `visio-field.vsdx`: an atomic text field followed by ordinary editable text.
- `visio-dynamic.vsdx`: a Width cell with `INDIRECT("Width")`, which must continue
  to fail dependency-closure validation.
- `visio-text-dependencies.vsdx`: two independent local labels, connectors with
  implicit and explicit self-event triggers, and a connector master with local
  text-measurement/visibility formulas. Label edits must retain all connector
  formulas, caches and master parts. The dependency test mutates copies to verify
  that unknown/dynamic/cross-shape references and text locks remain refused.

The native integration test edits and reloads these through the installed viewer
and core editor. Its worker adapter runs the real editor/parser in jsdom; it does
not replace their validation or serialization behavior.

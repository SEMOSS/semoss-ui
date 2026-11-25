# UI Standard

Builds on [general.md](./general.md). How UI code uses classes and tokens, meets accessibility,
works on small screens and touch, and cases its text. [DESIGN.md](../../DESIGN.md) owns
composition, surface archetypes, tokens, and carve-outs; `@semoss/ui/next` is the component
authority ([libs/ui/AGENTS.md](../../libs/ui/AGENTS.md)).

## Styling

Class and token usage in components.

- Reuse existing components, semantic tokens, and local composites before adding utility classes.
- Use semantic classes such as `bg-background`, `text-foreground`, `text-muted-foreground`,
  `border-border`, and the approved status tokens. No hex values, raw palette shades, or a second
  accent color in a component.
- Use the existing type scale, spacing scale, radii, and control sizes. No arbitrary values such
  as `text-[13px]`, `p-[17px]`, `z-[999]`, or one-off pixel dimensions unless DESIGN.md requires
  them.
- Compose classes with `cn()` from `@semoss/ui/next`, with `className` last so callers can
  override. Never concatenate class strings.
- Extract a repeated class group into a named component or local constant; keep a single-use
  conditional group inline.
- Write the base layout for the narrowest viewport, then add responsive utilities only where the
  content needs them. Do not hide essential actions, reorder content away from DOM order, or
  create horizontal page overflow. See [ui.md: Responsive](#responsive-and-touch).
- Establish hierarchy with borders, spacing, and typography. No gradients, decorative blobs,
  excessive shadows, nested cards, or animation added just to look polished.
- Give fixed-format controls, tables, grids, editors, and media stable dimensions so loading, long
  labels, focus, and state changes do not shift layout.
- Prefer classes over inline styles. Inline styles are only for genuinely data-driven values the
  token or utility system cannot express.
- Tint with the token + slash-opacity idiom: `bg-primary/10`, `ring-ring/50`, `bg-destructive/20`,
  `hover:bg-accent`. `disabled:opacity-50` on a whole element is fine.
- Size icons with `size-4`/`size-5`. The smallest text size is `text-xs`.
- Use overlay components (`Dialog`, `Sheet`, `Drawer`, `Popover`, `DropdownMenu`, …); never
  hand-roll `fixed inset-0` + backdrop + `z-[N]`. They own stacking, focus traps, and a11y.
- Arbitrary values are allowed only to match an external constraint (a third-party widget, a fixed
  asset), with a comment on the preceding line saying which.
- Bring each touched file in line: migrate its violations or apply a carve-out below. Do not expand
  cleanup into unrelated files.

### Banned Patterns

| Banned | Example (wrong) | Instead |
|---|---|---|
| Arbitrary hex classes | `bg-[#f0f0f0]`, `border-[#E6E6E6]` | `bg-muted`, `border-border` |
| Raw Tailwind palette | `text-green-600`, `border-blue-500/40` | `text-success`, `border-primary/40` |
| Pixel/rem font sizes | `text-[11px]`, `text-[1.4rem]` | `text-xs`, `H2` |
| Arbitrary z-index | `z-[100]`, `z-[1501]` | Overlay components |
| Opacity on raw colors | `bg-white/15`, `text-black/50` | `bg-background/50`, `text-muted-foreground` |
| Inline style colors/fonts | `style={{ color: "#999" }}` | Token classes |
| Styling UI with `lightTheme` / `darkTheme` | `color: lightTheme.palette…` | Token classes; those presets are app theme-block data, not tokens |
| MUI / Emotion | `@mui/*`, `@emotion/*` | Removed; never reintroduce |
| Copied lib class strings | `textarea.tsx` classes on `<textarea>` | `<Textarea />` |
| Bare `@semoss/ui` imports | `from "@semoss/ui"` | `from "@semoss/ui/next"` |
| Local forks of lib components | local tooltip/modal/button | Import from `@semoss/ui/next` |
| Per-file status color maps | `BADGE_TONES = { blue: "bg-blue-500/10" }` | `Badge` variants + status/`chart-*` tokens |

### Carve-Outs

Nothing else is exempt.

1. **Token definitions:** literal values are allowed in `libs/ui/src/styles/globals.css` only.
2. **User-configured canvas data:** renderer `block-defaults/**/*Block.tsx` and Blocks workspace
   previews may use runtime inline styles, each with a comment saying it is user-configured. The
   renderer's own chrome follows all rules.
3. **ECharts:** option objects may need resolved color strings. Read `chart-1`…`chart-5` through
   one shared adapter; never a literal map in a feature file.
4. **Third-party style bridges:** adapter CSS may map a library's custom properties to SEMOSS
   variables. A literal an external API requires gets a comment naming the constraint.
5. **Host extension UI:** VS Code webviews use `--vscode-*` variables. Chrome extension CSS cannot
   use the UI package; new literals must match a `globals.css` token and say which in a comment.

Package-specific styling debt is listed in each package's `AGENTS.md`.

## Accessibility

Target [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/) for every interactive surface; the checks
below are working checks, not a full conformance assessment. Backend-only work needs no UI audit.

### Scope of a Fix

- Reuse `@semoss/ui/next` components and native semantics. Inspect rendered behavior; do not
  assume a shared wrapper implements every accessibility requirement.
- Fix in-scope issues without changing public APIs or unrelated navigation. Report shared
  primitive limitations that cannot be fixed within the authorized scope.

### Semantics and Names

- Use native buttons for actions, links for navigation, logical headings and landmarks, and
  table headers with correct associations (1.3.1, 2.4.6, 4.1.2).
- Every control needs a programmatic name. Prefer an associated visible label; placeholders
  and tooltips are not substitutes. An icon-only button needs an accessible name, usually
  `aria-label`. When visible text exists, the accessible name must contain it (2.5.3).
- Group related controls with `FieldSet`/`FieldLegend` where appropriate. Verify individual
  option names and group names for radio groups, sliders, and other composite controls.
- Give meaningful images appropriate alternative text. Use `alt=""` for decorative images and
  `aria-hidden="true"` for decorative icons, never for focusable controls (1.1.1).
- Expose expanded, selected, checked, invalid, and busy states where applicable. Do not add
  redundant roles or conflicting ARIA to library or native semantics.

### Keyboard, Focus, and Overlays

- Support the widget's keyboard model, including tab order, activation, arrow keys, and
  dismissal where applicable. Do not add custom arrow-key handling to ordinary links or
  buttons (2.1.1, 2.1.2).
- Keep DOM, visual, and logical focus order aligned; avoid positive `tabIndex`. Preserve
  visible focus and keep focused controls from being entirely hidden by author-created sticky
  bars or overlays (2.4.3, 2.4.7, 2.4.11).
- Use shared dialogs, sheets, drawers, menus, and popovers. Verify their title or name, initial
  focus, modal containment when applicable, dismissal, and focus return to the trigger or a
  logical successor. Non-modal content must not gain an arbitrary focus trap.
- Include `DialogTitle` and a useful `DialogDescription` where appropriate. If no description
  applies, deliberately omit the description association using the supported content API.
  A disabled Cancel button alone does not disable Escape, outside clicks, or the close icon;
  follow the [form dismissal policy](./react.md#modal-and-dialog-forms).
- Hover and focus content must be dismissible, hoverable, and persistent under 1.4.13, subject
  to its stated exceptions. Keep essential information available on touch and keyboard. Check
  [Tooltip](../../libs/ui/src/next/tooltip.tsx) for how to make content hoverable, and verify
  pointer travel into it. Tooltips must not contain interactive controls; do not claim automatic
  compliance from the primitive alone.

### Forms and Status Messages

- Follow [react.md: Forms](./react.md#forms) for `Form`/`Form*` composition, server errors, resets, and
  submission. Identify required fields in visible text and programmatic state; provide
  specific textual errors and useful correction suggestions (3.3.1, 3.3.2, 3.3.3).
- Labels, `aria-invalid`, description and error associations, and focus on invalid submission
  must all work. The Form wrappers have known association gaps
  ([react.md](./react.md#field-composition-and-accessibility)); rendered text or an alert alone
  is not a persistent field association. Report shared API gaps; do not fork the wrappers or
  waive the check.
- Do not submit, navigate, or change context merely because a value changes (3.2.2). Updating
  filter results is not automatically a change of context; preserve focus and communicate the
  meaningful result.
- Announce meaningful asynchronous statuses without routine focus movement (4.1.3). Prefer
  existing primitive behavior; otherwise use a stable `role="status"` region for polite
  updates, or `role="alert"` for urgent errors. These roles already imply live behavior. Do not
  announce every keystroke or duplicate the same error through a field alert, toast, and an
  additional live region. `aria-busy` alone is not a status message.
- Preserve accessible recovery after errors; a toast is not the only record of a persistent
  failure. For authentication changes, support password managers and paste and review 3.3.8;
  do not require a cognitive test without an allowed alternative or assistance.

### Contrast, Reflow, and Pointer Targets

- Text contrast (1.4.3): at least 4.5:1 normally; at least 3:1 only for text at least 18pt
  (24 CSS px) regular or 14pt (about 18.67 CSS px) bold. Small bold text still needs 4.5:1.
  Account for the criterion's exceptions such as inactive controls and logos.
- Non-text contrast (1.4.11): at least 3:1 against adjacent colors for visual information
  needed to identify controls and their states, and meaningful graphical objects. Not every
  decorative border needs contrast; inactive controls and unmodified user-agent appearance
  have exceptions. Verify focus, error, and selected states in both themes and never rely on
  color alone (1.4.1).
- Support text resizing to 200% (1.4.4). Content reflows at 320 CSS px width for horizontally
  written content (1.4.10), equivalent to a 1280px viewport at 400% zoom. Necessary
  two-dimensional content such as a data table may scroll in its own bounded region; this is
  not a blanket exception for page-level overflow. Also meet DESIGN.md's viewport and zoom checks.
- Pointer targets (2.5.8): at least 24 by 24 CSS px, unless a defined exception applies. For
  the spacing exception, a 24px-diameter circle centered on each undersized target must not
  intersect another target or the circle around another undersized target. Equivalent
  controls, inline targets, unmodified user-agent controls, and essential presentation have
  specific exceptions. An arbitrary 8px gap is not proof of compliance. Prefer 44 by 44 CSS px
  for primary touch actions; 44px is not the AA minimum.
- Gestures need an appropriate single-pointer alternative (2.5.1); dragging needs a
  non-dragging single-pointer alternative unless essential (2.5.7). A keyboard alternative
  alone does not satisfy these pointer requirements.

### What Counts as Verified

- Scope checks to the changed behavior: keyboard-only operation, visible and unobscured focus,
  overlay dismissal and focus return, field naming and associations, and relevant
  loading, error, and success announcements.
- Inspect the accessibility tree and test with a screen reader where available. An expected
  announcement is not a tested announcement; say which was actually checked.
- Check contrast, reflow and zoom, and target geometry for the affected surface. Use the
  package's existing focused tests. Use axe tooling only if installed and configured; inspect
  scripts before giving an exact command, and never install tools silently. Automated checks
  cannot certify full WCAG conformance.
- Reviewing documentation prose does not verify an application.
- Report concrete fixes, criterion IDs for findings, commands and results, and residual gaps.
  Do not attach a detailed compliance audit to unrelated tasks or report untested behavior as
  passing.

## Responsive and Touch

Mobile-first layout, touch targets, gestures, mobile navigation, viewport, and safe areas. The
procedure is [make-responsive](../../skills/make-responsive.skill.md).

### Layout

- Write unprefixed styles for the narrowest supported viewport, then add breakpoints when
  content needs them. Tailwind defaults are `sm` 40rem, `md` 48rem, `lg` 64rem, and `xl` 80rem
  (640/768/1024/1280 CSS px at the default 16px size). Check theme overrides. These are layout
  thresholds, not phone or tablet detection, and not evidence of touch capability.
- Prefer `w-full`, `min-w-0`, `max-w-*`, wrapping action groups, responsive grid tracks, and
  `aspect-*`. Stable sizes for icon buttons and media are fine; fixed dimensions are not
  banned. Avoid unexplained arbitrary values under DESIGN.md.
- Preserve logical DOM and focus order as content stacks. Avoid CSS reordering that makes
  keyboard order differ from the visual sequence. Controls stay usable with long labels,
  translated text, large text, and reduced motion.
- A responsive screenshot does not prove a usable touch experience.

### Touch Targets

- Meet the [WCAG target-size rule and exceptions](#contrast-reflow-and-pointer-targets).
  The AA baseline is 24 by 24 CSS px; prefer 44 by 44 CSS px for primary touch actions. There
  is no universal 8px-gap rule. Measure the actual target and spacing, not its icon.
- Reuse `Button` sizes and token-scale padding and minimums; no `Button` size is 44px today
  ([button.tsx](../../libs/ui/src/next/button.tsx)). A `min-h-11 min-w-11` constraint can supply
  the preferred touch area; verify computed dimensions and avoid overlapping hit areas.
- Do not hide essential content or actions behind hover. Provide accessible names and
  keyboard and touch access independently of tooltips. For hoverable tooltips, use the
  supported root override and verify hover, focus, and Escape behavior.

Standalone example; `onRemove` invokes the feature's existing removal or confirmation flow:

```tsx
import { Trash2 } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface RemoveItemButtonProps {
	/** Requests the feature's removal or confirmation flow. */
	onRemove: () => void;
}

/** Provides a named removal action with a larger touch target. */
export const RemoveItemButton = ({ onRemove }: RemoveItemButtonProps) => (
	<Tooltip disableHoverableContent={false}>
		<TooltipTrigger asChild>
			<Button
				type="button"
				size="icon-lg"
				variant="ghost"
				className="min-h-11 min-w-11"
				aria-label="Remove item"
				onClick={onRemove}
			>
				<Trash2 aria-hidden="true" />
			</Button>
		</TooltipTrigger>
		<TooltipContent>Remove item</TooltipContent>
	</Tooltip>
);
```

### Forms

Use the [canonical form pattern](./react.md#canonical-pattern) and let fields and actions fill
or wrap within the available width. Do not add another native form. Errors and the submit and
cancel actions stay reachable when the virtual keyboard resizes the viewport; a fixed footer
must not hide the focused input.

### Data Tables

Choose horizontal scrolling, column prioritization, or an alternate compact representation
based on the task. Keep comparison semantics and access to hidden information; do not
automatically duplicate every table as cards. In this composition fragment,
`wrapperClassName="overflow-visible"` turns off `Table`'s own overflow wrapper so the named,
focusable outer region is the single scroll owner. Use it when a keyboard-accessible scroll region is
needed, preserve focus styling, and supply real headers and rows from the feature:

```tsx
<div
	className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"
	role="region"
	aria-label="Audit results"
	tabIndex={0}
>
	<Table className="min-w-max" wrapperClassName="overflow-visible">
		<TableHeader>{headers}</TableHeader>
		<TableBody>{rows}</TableBody>
	</Table>
</div>;
```

### Drawers and Sheets

Use `Drawer` for mobile-first tasks, `Sheet` for contextual detail, or the existing `Dialog`
for focused decisions; do not replace every dialog at a breakpoint. Include each primitive's
title and appropriate description, initial focus, a visible dismissal path, and focus return.
Keep long content scrollable with actions reachable. Reuse the library's backdrop and stacking.
For forms, apply the [pending-dismissal policy](./react.md#modal-and-dialog-forms) to every
close path, including gestures.

### Navigation

- Preserve information architecture. `Tabs` switch associated panels; navigation links change
  location. A narrow viewport is not a reason to turn all tabs into a hamburger menu or bottom
  navigation. Keep selected state, panel relationships, and keyboard behavior.
- Choose wrapping or a clearly discoverable scrollable tab list when suitable; the focused and
  selected tab stays visible. Use an existing mobile navigation shell or a named `Sheet`
  trigger for genuinely collapsed site navigation when content requires it.
- Keep one active navigation representation accessible at each breakpoint. Close a mobile
  navigation overlay after selection and handle focus when resizing hides its trigger.
  Preserve Escape and outside dismissal where appropriate; do not impose it on a
  non-cancellable in-flight form without its dismissal policy.

### Viewport and Safe Areas

Preserve a zoom-capable viewport declaration in the owning HTML document:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Do not add `user-scalable=no` or a zoom-limiting `maximum-scale`, or remove legitimate existing
viewport options. Use dynamic viewport units when mobile browser chrome affects an edge-to-edge
surface. Apply safe-area padding only at the owning edge, with distinct left and right insets;
do not apply the left inset to both sides or double-pad nested content. Where edge-to-edge
rendering is intended, coordinate `viewport-fit=cover` with all affected edges and devices.
Use DESIGN.md's viewport exception, not arbitrary sizing throughout the app.

### Touch Gestures

Reuse the feature's existing gesture implementation first. For a small custom interaction,
keep touch tracking in a hook, do not block native scrolling or zoom indiscriminately, and
provide visible button alternatives usable by single-pointer and keyboard input. Dragging
requires a non-dragging pointer alternative too. Honor reduced motion for animated responses.

There is no shared swipe hook. Build one in `libs/ui/src/hooks/` only when two consumers need
it; keep it to one gesture, ignore multi-touch and mostly vertical movement, and return native
`onX` handler props.

Call the hook unconditionally at the top level of the owning component, then spread its
handlers onto the intended non-control surface. Do not intercept gestures over inputs or other
nested interactive elements; use the existing gesture library if arbitration is needed. Keep
explicit previous and next controls available; a gesture is an enhancement, not the only path.

### Content, Scrolling, and Performance

- Preserve aspect ratios and reserve media dimensions. Use responsive `srcSet`/`sizes` or
  `<picture>` where useful; JSX spells it `srcSet`. Choose `object-contain` when users need the
  whole object, `object-cover` only when cropping is acceptable. Lazy-load off-screen images,
  not a critical first-viewport image.
- Use shared Typography components and the design type scale. Wrap long content with a
  shrinkable parent (`min-w-0`); truncation requires a keyboard- and touch-accessible
  full-value path. Do not shrink important text just to make it fit.
- Preserve scroll reachability and a discoverable overflow affordance. Do not set body overflow
  to hidden to conceal layout bugs; let shared modal primitives own scroll locking. Avoid
  unnecessary competing scroll containers.
- Measure main-thread work before optimizing. Debouncing every scroll handler by a fixed delay
  is not a general fix. Use an existing observer or scheduling abstraction when appropriate;
  clean up subscriptions, and do not make a listener passive if it must prevent default
  behavior. Follow [react.md](./react.md) for lazy loading and supported React versions.

## UI Text

Casing for user-facing English text in components, the `en` locale JSON, and the tests that assert
it. Do not mass-rename; bring a string in line when you write or change it, and update the tests
and docs that quote it in the same change.

### Title Case: Names of Things

Anything that names a thing the user reads as a label or clicks is in Title Case:

- page, section, card, tile, dialog, sheet, and panel titles, and headings
- tabs, buttons, links that act as buttons, and menu items
- setting names, such as a switch tile's title, and form field labels
- table column headers, badges, and status labels
- the tooltip of an icon-only button, which is that button's label

Examples: Use as Template, Custom Login Page, Open in Sidebar, Give a Team Access,
Copy People From a Team, Bring In Access, Sign In, Read-Only, Non-Discoverable, Copy ID.

The rules:

- Capitalize the first and the last word, whatever they are.
- Capitalize every noun, pronoun, verb (short ones too: Is, Be, Go), adjective, and adverb.
- Lowercase articles (a, an, the), the conjunctions and, but, or, nor, for, so, yet, and
  prepositions of three letters or fewer (as, at, by, for, in, of, off, on, out, per, to,
  up, via), unless they are the first or last word. Capitalize prepositions of four letters
  or more: From, Into, Over, With.
- Capitalize the particle of a phrasal verb, which acts as part of the verb: Sign In,
  Log Out, Set Up, Bring In Access.
- Capitalize each part of a hyphenated compound: Non-Discoverable, Read-Only, In-Line.
- Keep product names, acronyms, and identifiers as they are written: SEMOSS, SMSS, MCP,
  JSON, ID, Python, `text-generation-model`.
- A title that changes with its state is Title Case in every state, and names the state
  the thing is in: Private or Public, Discoverable or Non-Discoverable.
- A loading label keeps the casing of the label it replaces and ends in three ASCII dots,
  so Save becomes Saving... and Delete becomes Deleting...

### Sentence Case: Sentences

Text that reads as a sentence, or explains something, is in sentence case, with only its
first word and proper nouns capitalized:

- descriptions under a title, help text, and explanatory tooltips
- toasts, errors, empty states, and confirmations
- placeholders
- accessible names that are sentences, such as a switch's `aria-label`
  ("Login App has a custom login page")

A name quoted inside a sentence keeps its Title Case: "Pressing Save Limit saves at once."

### Locales and Tests

- Title Case is an English convention. Other locales follow their own language's
  capitalization; translate the meaning, and do not carry English Title Case into them.
  Every key still changes in every language, as [libs/i18n/AGENTS.md](../../libs/i18n/AGENTS.md)
  requires.
- Tests that find elements by visible text or accessible name change with the text.
  `data-testid` values are not copy and stay as they are.
- Accessible names must still contain the visible label; see
  [ui.md: Accessibility](#semantics-and-names).

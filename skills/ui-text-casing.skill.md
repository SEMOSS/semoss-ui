---
name: ui-text-casing
description: Write English UI names in Title Case (titles, headings, tabs, buttons, menu items, setting and field labels, column headers, status labels) and full sentences in sentence case. Use when adding or changing user-facing text in React components or the English locale files.
---

# UI Text Casing

## When to Use This Skill

Load it whenever you add or change user-facing English text: copy written in a component,
the `en` locale JSON in `libs/i18n`, and the tests that assert that text. Existing text is
not mass-renamed; bring a string in line when you write it or change it, and update the
tests and docs that quote it in the same change.

## Title Case: Names of Things

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

## Sentence Case: Sentences

Text that reads as a sentence, or explains something, is in sentence case, with only its
first word and proper nouns capitalized:

- descriptions under a title, help text, and explanatory tooltips
- toasts, errors, empty states, and confirmations
- placeholders
- accessible names that are sentences, such as a switch's `aria-label`
  ("Login App has a custom login page")

A name quoted inside a sentence keeps its Title Case: "Pressing Save Limit saves at once."

## Locales and Tests

- Title Case is an English convention. The other locales follow their own language's
  capitalization; translate the meaning, and do not carry English Title Case into them.
  Every key still changes in every language, as
  [libs/i18n/AGENTS.md](../libs/i18n/AGENTS.md) requires.
- Tests that find elements by visible text or accessible name change with the text.
  `data-testid` values are not copy and stay as they are.
- Accessible names must still contain the visible label; see the
  [accessibility skill](./accessibility.skill.md).

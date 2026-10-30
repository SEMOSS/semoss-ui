---
target: Collaboration Routines page and related sections
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/rweiler/Documents/SEMOSS/workspace/apache-tomcat-11.0.24/webapps/SemossWeb/packages/collaboration/src/features/routines/routines-workspace.tsx"
target_fingerprint: "sha256:196004aad4959de5ab544aeb25d3e8cbd7567921cf0e27d99a8b319b518dd3b8"
target_path: /Users/rweiler/Documents/SEMOSS/workspace/apache-tomcat-11.0.24/webapps/SemossWeb/packages/collaboration/src/features/routines/routines-workspace.tsx
timestamp: 2026-10-29T20-38-00Z
slug: features-routines-routines-workspace-tsx-6d1683f2
---
Method: dual-agent (A: design review agent · B: detector agent)

**The one-line answer:** the page is built around configuring a routine, but people come to read what it produced. Flip that, and most of the other problems shrink.

## Design health score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Status shows intent, not health: the screenshot says On, Scheduled and Completed while the latest brief is Monday's (today is Thursday; the schedule looks like Mon-Sat). Built-in routines never refresh during a run. |
| 2 | Match with the real world | 3 | Plain, honest copy. Leaks: a UUID folder in the documents breadcrumb, unexplained "MES", raw IANA zone names. |
| 3 | User control and freedom | 2 | Run now only on event planning and custom routines; no cancel; new routines start already on (new-custom-routine.tsx:42); Delete is a window.confirm beside Run now (custom-routine-card.tsx:110). |
| 4 | Consistency and standards | 2 | Off is "Off", "Paused" or "Not enabled" (routine-nav.tsx:45, routine-card-header.tsx:42-43); four labels for opening a chat or run. |
| 5 | Error prevention | 2 | "Write reply drafts" defaults on and sits under the schedule fields; the "Setup needs attention" alert renders after the card body, far below the switch (inbox-routine-form.tsx:344). |
| 6 | Recognition rather than recall | 2 | Every list row says "On", so the list tells you nothing; the mobile picker drops status (routine-nav.tsx:76-86). |
| 7 | Flexibility and efficiency | 1 | No way to test a change without waiting a day; 35 Tab stops from the list to Ask Assistant (measured); each past output opens as a new chat. |
| 8 | Aesthetic and minimalist design | 2 | Stock-photo hero, six "(required)" labels on always-filled fields, on-state shown four times, time zone three times, frames nested 3-4 deep. |
| 9 | Error recovery | 2 | A failed built-in run offers nothing to do: only custom-routine-card.tsx:219 passes canOpenRun. |
| 10 | Help and documentation | 3 | Good inline help at the point of need (lookback, drafts, View flow); a bit wordy. |
| **Total** | | **21/40** | **Acceptable** |

## Design specificity verdict

**Design review:** generic. List on the left; a card with a form in the left half and a preview in the right half; segmented tabs; a stock boardroom photo. Any "Automations" settings page could ship this with other labels. Two things are this product's own: the copy ("Briefs are emailed only to you", "Drafts are never sent") and the robots. Both decorate the page instead of shaping it. Showing the real output next to its settings is the right instinct, built as a cramped preview instead of the point of the page.

**Detector scan:** impeccable detect found 0 findings in the 62 files under features/routines/. A probe file confirmed it scans TSX, so the clean result is real: none of the stock tells. It is regex-only on source, so it cannot see what is wrong here (rendered contrast, hierarchy, layout), and it misses rule breaks that live elsewhere: the purple comes from the shared Button's assistant variant (used only at routine-chat-button.tsx:75), and the hand-rolled overlay at routine-documents-dock.tsx:119 (fixed inset-0 z-50 bg-black/50) breaks a DESIGN.md rule the detector doesn't know.

**Visual overlays:** none. The overlay server could not bind a local port in the sandbox (EPERM), so nothing was injected. sandbox.network.allowLocalBinding: true in Claude Code settings enables it.

## Overall impression

The bones are good: trustworthy autosave, honest copy, one shared skeleton for all five routine kinds. The problem is emphasis. Opening a routine lands on a settings form (routine-detail.tsx:22 defaults to Settings), left and top. The brief, the reason the routine exists, gets a ~380px box on the right that scrolls both ways. A decorative photo sits above it all. The status is said four times, and none of the four notices the missing briefs in the screenshot.

Proposed layout:

    Routines
    Your assistant's repeat work: briefs, agendas, plans and reviews.
    [System routines] [My routines]

    +--------------------+ +----------------------------------------------+
    | Inbox daily brief  | | Inbox daily brief agent               On [*] |
    | Next: Fri 11:45 AM | | Next run Fri Oct 30, 11:45 AM ET             |
    |                    | |                                              |
    | Meeting agendas    | | Latest   Settings   History   Ask about this |
    | Next: Mon 8:00 AM  | | -------------------------------------------- |
    |                    | | Morning Work Briefing - Mon Oct 26           |
    | Event planning     | | Suggested priorities                         |
    | Off                | |  * Due today ...                             |
    |                    | | (the brief at full card width,               |
    | Expense review     | |  no inner scroll box)                        |
    | Last run failed    | |                                              |
    +--------------------+ +----------------------------------------------+

Five moves get there, and most are deletions.

## What's working

1. Autosave you can trust: debounced, in order, flushed on unmount; opened routines stay mounted (use-routine-autosave.ts, routines-workspace.tsx:327). The save-status slot reserves its width.
2. One skeleton for five routine kinds (RoutineNav, RoutineCardHeader, RoutineResult, RoutineDetail), so the restructure below is one pattern applied five times. List status is text plus a dot.
3. Reassurance at the risky moments ("emailed only to you", "Drafts are never sent", "nothing is approved"), and careful a11y details: 44px day buttons with full day names, focus kept after Ignore/Restore, the running timer outside the live region.

## Priority issues

1. [P1] The output is a side panel; make it the page. Why: reading is the daily job, settings change rarely. Columns are ~379px at 1440, 292px at 1280, 202px at 1100 (where the meeting picker overflows into the result column); on mobile "Latest brief" starts ~1,960px down. Fix: routine-detail.tsx tabs Latest | Settings | History, Latest default once a run exists, RoutineResult at full card width; drop lg:grid-cols-2 from inbox-routine-form.tsx:204, agenda-routine-form.tsx:114, event-planning-form.tsx:142, expense-routine-form.tsx:145, custom-routine-card.tsx:144 (settings become one max-w-2xl column); put name, switch and status above the tabs (today the tabs sit above the routine's name, and History loses it). Command: /impeccable layout.
2. [P1] Status is said four ways, and sometimes wrong. List "On", "Scheduled" badge, "Enable daily brief" switch, "Next scheduled" line, plus "Completed". An off routine with a filled schedule says "Choose your schedule to get started" (routine-next-run.tsx checks nextRunAt and enabled, never configured). If Mon-Sat are on, three briefs are missing in the screenshot, yet it says Scheduled. Fix: one line under the title ("On · next run Fri Oct 30, 11:45 AM" / "Off · runs Mondays at 8:00 AM when on" / "Last run failed Oct 23 · Try again"); the switch replaces the badge; "Off" everywhere; list rows show the next run or the failure; time zone once, only when it differs from the browser's. Command: /impeccable clarify, then /impeccable distill.
3. [P1] Running and failed runs are dead ends for built-in routines. Only custom-routines-tab.tsx:46 polls; system forms never pass canOpenRun; Run now only on event planning and custom. Fix: poll in RoutineLoader while lastRun.status === "running"; pass canOpenRun; Run now on inbox and agendas (server: WorkRunInboxRoutineReactor and WorkRunAgendaRoutineReactor take no args; copy event planning's now=true path); expense gets "Review a request now". Command: /impeccable harden.
4. [P2] Selected days are invisible: rgb(240,246,255) on white, same border and weight, ~1.05:1 (fails WCAG 1.4.11). Single-day pickers look like multi-day ones. Pasted four times (inbox :224-279, agenda :134-191, event :191-248, custom-routine-fields.tsx:51-86). Fix: one RoutineDayPicker with data-[state=on]:border-primary bg-primary/10 text-primary and a "Pick one day" hint. Command: /impeccable polish.
5. [P2] Decoration is louder than content: stock hero (routines-workspace.tsx:279-286, banned by DESIGN.md; a 128x40 sliver on mobile); purple sparkle Ask Assistant (second accent; loudest element); chart-1..4 tiles from today's icon change shift hue in dark mode (inbox becomes primary blue, event planning assistant purple; party hat ~1.7:1). Fix: delete image and md:w-3/5 md:pr-6, describe all outputs; outline "Ask about this brief"; muted tile with colored glyph or fixed per-agent color. Command: /impeccable quieter.

## Persona red flags

- Alex (power user): can't test a change without waiting a day; list has no arrow keys and scrolls away; Settings/History resets per routine; each past output costs a new chat; 202-292px columns at 1100-1280.
- Sam (keyboard/screen reader): focus drops to body after New routine and Cancel (custom-routines-tab.tsx:116-131); every History row button is just "Open chat" (routine-history.tsx:156); disabled Run now gives no reason; invisible selected days; hand-rolled maximize overlay with no Escape or focus trap (routine-documents-dock.tsx:116-130); breadcrumb announces as "Toggle menu".
- Jordan (first-timer): "Choose your schedule" beside a filled schedule; Paused vs Off; three levels of tabs at once; drafts on by default and out of view; "MES" unexplained (expense-routine-form.tsx:197); new routine created already on, Create below the fold.

## Minor observations

- Six "(required)" labels; mark optional fields instead. Lookback as one select (12h / 24h / 36h / 3 days / 1 week).
- ~400 raw IANA zones in a plain Select, no search (routine-time-fields.tsx); default to the browser zone behind "Change".
- "Weekly meeting agendas agent" wraps in the 16rem list; "Meeting agendas agent" fits.
- Idle save slot leaves a ~112px hole beside the badge.
- "Could not load routines" for one routine (routine-loader.tsx:49); "…" and "..." mixed.
- Generic Repeat tile on My routines and Bot icon while running: two tabs read as two products.
- packages/collaboration/PRODUCT.md still describes only the inbox brief.
- Not seen: populated History, View flow graph, the setup alert, loading and save-error states; the inbox brief only via the screenshot.

## Questions to consider

- People come to read and rarely touch settings: should Routines be an inbox of outputs, newest first, with settings one click away?
- Do built-in and user-made routines need separate tabs, or one list sorted by what runs next?
- What if turning a routine on started with a preview run showing the real brief and the drafts it would write?

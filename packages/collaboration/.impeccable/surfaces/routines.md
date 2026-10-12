# Routines

Mode: Operate. Extension of the existing Collaboration interface.

The first viewport identifies the one available routine and its persisted status, then exposes opt-in, run days, local time, timezone, and email count. The primary action saves that complete configuration. The latest completed brief lives below the settings. Before the first run, explain when and where it will appear without sample inbox content.

Reuse CollaborationPage, CollaborationPageHeader, and @semoss/ui/next. Preserve the shared palette, type, navigation, and spacing. Use a single routine card with an inline form; supporting context stacks after the form on narrow screens. Day selection uses the existing toggle group. Availability, saving, failed reads and writes, paused schedules, running briefs, and failed runs have explicit text and recovery actions.

# `components/`

Styled, presentational React components — the `@semoss/chat/components`
package entry point. These are built on `@semoss/ui` (tokens, `Button`,
`Spinner`, etc.) so they match the rest of the SEMOSS design system rather
than an invented palette.

Consumers of this entry point must already have `@semoss/ui/globals.css`
imported and a `@semoss/ui/next` `<ThemeProvider>` above them — this folder
ships no CSS of its own beyond that dependency.

## Layout

Flat, one file per component: `<component-name>.tsx` + a co-located
`<component-name>.test.tsx`. Re-export every public component from
`components/index.ts`.

## Conventions

- Components read state via the hooks in `../contexts/` (e.g.
  `useChatContext`, `useChatRoomsContext`) — never import a `../stores/`
  store or `../transport/` call directly from a component.
- Keep components presentational: data fetching/mutation belongs in
  `../stores/`; a component's job is to render state and call the actions a
  context hook already gives it.
- Add new components to `components/index.ts` so they're part of the public
  `@semoss/chat/components` surface.

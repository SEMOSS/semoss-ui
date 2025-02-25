## Status

Everything works as aniticipated, and we could push and app builder should work as expected.

Builds in local development environment as anticipated.

Also ran our prod command with no build errors

`npx nx run-many -t build -p @semoss/client --verbose`

(looking at our git actions from a couple of days ago it builds correctly as well)

Today i fixed up the last couple of blocks that were broken.

-   [x] LLM Compare Block (Lot of TS errors)
-   [x] Data Import (DataImportFormModal) (Lot of TS errors)
-   [x] Listener Settings

## How to build locally and test

Clean slate

-   Force install all modules (likely have to delete node_mods and the pnpm-lock in the root)

Then run:

`pnpm run dev:client`

**_Routes to test_**:

Use - `http://localhost:9090/semoss-ui/packages/client/dist/#/app/5698389c-3ba8-4846-b915-d69b0245acc6`

Share - `http://localhost:9090/semoss-ui/packages/client/dist/#/s/5698389c-3ba8-4846-b915-d69b0245acc6`

Edit - `http://localhost:9090/semoss-ui/packages/client/dist/#/workspace/5698389c-3ba8-4846-b915-d69b0245acc6`

Testing - `http://localhost:9090/semoss-ui/packages/client/dist/#/test-renderer`

## How to use as a lib

When using the `<Renderer />` from the lib to view an app (interactive) - very easy to use just import Renderer and pass necessary props

To edit, you will have to import modules from the lib to be able to manipulate state

## Tasks

1. When using our blocks workspace from within `packages/client` I export things like state store, notebook store, useBlocks to be able to manipulate within our workspace take look at our panels in workspace.

-   [ ] The components used to manipulate state in our workspace should move ( but they arent hurting anything rn )

2. Whats needed next is to move our coupled notebook from within render out

-   [ ] Isolate notebook into its own lib (may be a heavy lift)

For now I kept all the tightly coupled code in the renderer lib (state, notebook store).

## Plan of action

I think we would make solid progress with one more week at it (40 hours, uninterupted)

We can package this thing up on npm today ( but i don't think we should yet ) this cleanup will be pretty beneficial. I want to say a week or two weeks

-   [ ] I can continue this week and try to move notebook code, Which i'll likely continue tomorrow. ( I can try to get done by end of week ).  
         OR
-   [ ] Find dev (Ashley if time permits) to work on this above in the background (will make sure this stays up to date with changes on dev, i saw you pushed up bug fixes and will make sure they get in)

Everything works as aniticpated and as it did before minus two components which we are fixing.

-   LLM Compare BLOCK
-   Data Import (DataImportFormModal)

Seems to build as anticipated.

I kept all the tightly coupled code in the renderer lib.

When using Renderer as solely visual and as an app (interactive) - very easy to use just import Renderer and pass necessary props

When you want to modify our state, as we do in BlocksWorkspace ( possibly can import this as its own component ), thats where we export quite a bit in order to interact state blocks and notebook.

Notebook will have to move to a seperate lib as well ( just want to put all in renderer until we do so - next step )

Will try to find dev to continue working through this, just will have to make sure this stays up to date with state changes

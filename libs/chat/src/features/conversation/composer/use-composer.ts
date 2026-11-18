import { useContext } from "react";
import { type Composer, ComposerContext } from "./composer.context";

/**
 * Read the composer an item of the plus menu or a "/" command is in.
 *
 * @returns The composer's room, state, and actions.
 * @throws When called outside the composer's menus.
 */
export const useComposer = (): Composer => {
	const composer = useContext(ComposerContext);
	if (!composer) {
		throw new Error("useComposer must be used inside the composer's menus");
	}
	return composer;
};

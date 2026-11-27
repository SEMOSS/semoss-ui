import { useRoom } from "@semoss/chat";
import { DesktopRoot } from "./desktop-root";
import { useDesktopTools } from "./desktop-tools.context";

/**
 * The room's attached folders in its Files: one Desktop tree after Room,
 * whose menu attaches folders. The chat draws it inside the room's Workspace
 * (`ChatComponents.WorkbenchFileRoots`).
 *
 * @returns The Desktop tree, which draws nothing itself.
 */
export const DesktopFileRoots = () => {
	const room = useRoom();
	const store = useDesktopTools().foldersFor(room.roomId);

	return <DesktopRoot store={store} />;
};

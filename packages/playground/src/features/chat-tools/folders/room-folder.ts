import { getFileExplorerAdapter } from "@semoss/shared";
import { ROOM_FILES_NAME } from "../tools/folder-tools";
import {
	AssetFolderProvider,
	type AssetFolderSpace,
	type PixelOutputRunner,
} from "./asset-folder";

/**
 * The chat's own files. The room's tool settings live in its `mcp` folder,
 * which the folder tools leave alone: rewriting or deleting it would switch
 * the chat's tools and connectors off.
 */
const ROOM_SPACE: AssetFolderSpace = {
	assets: getFileExplorerAdapter({ type: "INSIGHT" }),
	spaceName: ROOM_FILES_NAME,
	reservedNames: ["mcp", ".git", ".admin"],
};

/**
 * The chat's own files ("Chat Files"), the room's folder, read and written
 * through the insight asset pixels. The pixels have to run against
 * the room's insight, whose folder is the room's once the room is bound to it.
 * The user's uploads and saved downloads are here, and the chat's other tools
 * read and write it too.
 */
export class RoomFolderProvider extends AssetFolderProvider {
	/**
	 * @param run - Runs the insight asset pixels against the room's insight.
	 */
	constructor(run: PixelOutputRunner) {
		super(ROOM_SPACE, run, "");
	}
}

import { decodeBase64Asset, type FileExplorerAdapter } from "@semoss/shared";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";
import type { FolderEntry, WorkFolderProvider } from "../teamwork.types";
import {
	getFolderPathName,
	getParentFolderPath,
	joinFolderPath,
	splitFolderPath,
} from "./folder-path";
import { FolderToolError } from "./folder-text";

/**
 * Run one pixel and resolve to its first statement's output, throwing when
 * the pixel reports an error.
 */
export type PixelOutputRunner = (pixel: string) => Promise<unknown>;

/** What sets one asset space apart from another. */
export interface AssetFolderSpace {
	/** The space's pixels, shared with the file explorer. */
	assets: FileExplorerAdapter;
	/** How errors the model reads name the space. */
	spaceName: string;
	/**
	 * Top level entries the folder hides and never touches, such as the
	 * settings the chat's tools are kept in.
	 */
	reservedNames: readonly string[];
}

/**
 * Characters the asset pixels cannot carry: several of them interpolate the
 * path into a quoted string as is.
 */
const UNSAFE_ASSET_PATH = /["\\]/;

/** One row of a `Browse*Assets` listing. */
interface AssetRow {
	name?: unknown;
	type?: unknown;
	lastModified?: unknown;
}

/**
 * A folder in one of the server's asset spaces, read and written through that
 * space's asset pixels.
 *
 * `root` scopes the folder inside the space, so a work folder can be one
 * project folder rather than everything the space holds. The root itself is
 * never written, moved, or deleted: `Delete*Assets` without a path clears the
 * whole space, so an empty path must never reach it.
 */
export class AssetFolderProvider implements WorkFolderProvider {
	/**
	 * @param space - The asset space.
	 * @param run - Runs the asset pixels, usually against the room's insight.
	 * @param root - Folder within the space, normalized; `""` is all of it.
	 */
	constructor(
		private readonly space: AssetFolderSpace,
		private readonly run: PixelOutputRunner,
		readonly root: string,
	) {}

	async list(path: string): Promise<FolderEntry[]> {
		const output = await this.run(
			this.space.assets.browse(this.toAssetPath(path, true)),
		);
		if (!Array.isArray(output)) {
			return [];
		}

		return output.reduce<FolderEntry[]>((entries, row: AssetRow) => {
			if (typeof row?.name !== "string" || !row.name) {
				return entries;
			}
			const entryPath = joinFolderPath(path, row.name);
			if (this.isReserved(entryPath)) {
				return entries;
			}
			entries.push({
				path: entryPath,
				name: row.name,
				kind: row.type === "directory" ? "directory" : "file",
				modified:
					typeof row.lastModified === "string"
						? row.lastModified
						: undefined,
			});
			return entries;
		}, []);
	}

	async readFile(path: string): Promise<Blob> {
		const output = await this.run(
			this.space.assets.read(this.toAssetPath(path, false), true),
		);
		const bytes =
			typeof output === "string" ? decodeBase64Asset(output) : null;
		if (!bytes) {
			// an empty file comes back as an empty string
			if (output === "") {
				return new Blob([]);
			}
			throw new FolderToolError(`Could not read ${path}.`);
		}
		// slice() yields a copy backed by a plain ArrayBuffer, which Blob takes
		return new Blob([bytes.slice()]);
	}

	async writeText(path: string, content: string): Promise<void> {
		// base64 carries any text, including a literal closing encode marker
		// that would end a plain `<encode>` block early
		const encoded = encodeBytesToBase64(new TextEncoder().encode(content));
		await this.run(
			this.space.assets.save(
				this.toAssetPath(path, false),
				encoded,
				true,
			),
		);
	}

	async createDirectory(path: string): Promise<void> {
		await this.run(
			this.space.assets.createDirectory(this.toAssetPath(path, false)),
		);
	}

	async move(from: string, to: string): Promise<void> {
		const source = await this.stat(from);
		if (!source) {
			throw new FolderToolError(`Nothing exists at ${from}.`);
		}
		if (await this.stat(to)) {
			throw new FolderToolError(
				`Something already exists at ${to}. Choose another destination, or delete it first.`,
			);
		}
		await this.run(
			this.space.assets.rename(
				this.toAssetPath(from, false),
				this.toAssetPath(to, false),
			),
		);
	}

	async remove(path: string, _recursive: boolean): Promise<void> {
		// the reactor deletes folders with their contents; the tool layer has
		// already confirmed a non-empty folder was meant to go
		await this.run(this.space.assets.remove(this.toAssetPath(path, false)));
	}

	async stat(path: string): Promise<FolderEntry | null> {
		if (!path) {
			return {
				path: "",
				name: getFolderPathName(this.root),
				kind: "directory",
			};
		}
		if (this.isReserved(path)) {
			return null;
		}

		const name = getFolderPathName(path);
		let siblings: FolderEntry[];
		try {
			siblings = await this.list(getParentFolderPath(path));
		} catch {
			// the parent does not exist, so neither does the entry
			return null;
		}
		return siblings.find((entry) => entry.name === name) ?? null;
	}

	/**
	 * Whether a path falls under one of the space's reserved top level
	 * entries.
	 *
	 * @param path - A normalized path inside this folder.
	 * @return True when the folder hides and never touches it.
	 */
	private isReserved(path: string): boolean {
		const [top] = splitFolderPath(joinFolderPath(this.root, path));
		return (
			top !== undefined &&
			this.space.reservedNames.some(
				(name) => name.toLowerCase() === top.toLowerCase(),
			)
		);
	}

	/**
	 * The path the asset pixels expect, which is rooted at the space with a
	 * leading slash, the same form the file explorer sends.
	 *
	 * @param path - A normalized path inside this folder.
	 * @param allowRoot - Whether the folder root itself may be addressed.
	 * @return The space's path.
	 * @throws FolderToolError when the root is not allowed, the path is
	 * reserved, or the path cannot be carried by a pixel.
	 */
	private toAssetPath(path: string, allowRoot: boolean): string {
		if (!path && !allowRoot) {
			throw new FolderToolError(
				"That operation needs a path inside the work folder, not the folder itself.",
			);
		}
		if (path && this.isReserved(path)) {
			throw new FolderToolError(`Nothing exists at ${path}.`);
		}

		const full = joinFolderPath(this.root, path);
		if (UNSAFE_ASSET_PATH.test(full)) {
			throw new FolderToolError(
				`Paths in ${this.space.spaceName} cannot contain double quotes or backslashes.`,
			);
		}
		return full ? `/${full}` : "";
	}
}

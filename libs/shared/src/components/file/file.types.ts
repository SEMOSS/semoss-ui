/**
 * The mode for a File
 */
export type FileMode =
	| {
			type: "APP";
			app: string;
	  }
	| {
			type: "ENGINE";
			engine: string;
	  }
	| {
			type: "STORAGE";
			storage: string;
	  }
	| {
			type: "INSIGHT";
			insightId?: string;
	  }
	| {
			// User-home-scoped asset tree. Reactors mirror the INSIGHT family
			// but against the current user's space (BrowseUserAssets,
			// GetUserAssets, SaveUserAssets, DownloadUserAsset,
			// DeleteUserAssets, RenameUserAsset, CopyUserAsset,
			// SearchUserAssets). Surfaced by `@semoss/terminal`'s ScopePicker
			// and the client's Settings > My Files page.
			type: "USER";
	  }
	| {
			// A tree the host reaches without Pixels, such as a folder on the
			// user's machine, registered under its own id. Its explorer and
			// panels work through the host's `FileSource`; there is no Pixel
			// for it, so `getFileExplorerAdapter` gives an adapter that refuses.
			type: "MOUNT";
			mountId: string;
	  };

/**
 * A single item
 */
export type FileItem = {
	/**
	 * Name of the file
	 */
	name: string;

	/**
	 * Path of the file
	 */
	path: string;

	/**
	 * Track if it is a directory
	 */
	type?: "directory";

	/**
	 * Last modified date
	 */
	lastModified?: string;

	/**
	 * Size in bytes, when the source reports it
	 */
	size?: number;

	/**
	 * What a custom adapter knows about the item beyond its path, such as a
	 * drive item's ids, for the host's row actions to read back.
	 */
	data?: unknown;
};

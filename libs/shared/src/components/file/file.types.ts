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
};

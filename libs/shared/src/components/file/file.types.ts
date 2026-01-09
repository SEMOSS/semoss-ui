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
			type: "INSIGHT";
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

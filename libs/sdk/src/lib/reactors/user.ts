/**
 * Built-in reactor inventory at Semoss 12781b2478eb97e2a27a911e9bdbc94b6f34ee88.
 * Named keys include inherited constructors and reachable execution/helper reads.
 * Required inputs are included where reachable organizeKeys/checkOptional enforces
 * them. Output shapes follow source values and PixelStreamUtility. Remaining value,
 * validation, and nested-shape gaps are explicit in contract-gaps.json; audited
 * contracts override these base contracts in catalog.ts.
 */
import type { SourceParameters } from "./source-parameters";
import type { ReactorContract } from "./value-types";

export interface UserReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/BrowseUserAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrowseUserAssets: ReactorContract<
		SourceParameters<"filePath", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/CopyUserAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CopyUserAsset: ReactorContract<
		SourceParameters<
			"comment" | "filePath" | "newValue",
			"both",
			["filePath", "newValue"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/CopyUserAssetsToInsightReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CopyUserAssetsToInsight: ReactorContract<
		SourceParameters<"filePath", "both", ["filePath"], 1>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/DeleteUserAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteUserAssets: ReactorContract<
		SourceParameters<"comment" | "filePath", "both">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/DownloadUserAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadUserAsset: ReactorContract<
		SourceParameters<"filePath", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/GetUserAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserAssets: ReactorContract<
		SourceParameters<"filePath", "both", ["filePath"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/GetUserAssetsBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserAssetsBase64: ReactorContract<
		SourceParameters<"filePath", "both", ["filePath"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/NewUserAssetsDirectoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NewUserAssetsDirectory: ReactorContract<
		SourceParameters<"comment" | "filePath", "both", ["filePath"], 1>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/NewUserAssetsFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NewUserAssetsFile: ReactorContract<
		SourceParameters<"comment" | "filePath", "both", ["filePath"], 1>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/RenameUserAssetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RenameUserAsset: ReactorContract<
		SourceParameters<
			"comment" | "filePath" | "newValue",
			"both",
			["filePath", "newValue"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/SaveUserAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveUserAssets: ReactorContract<
		SourceParameters<
			"comment" | "content" | "filePath",
			"both",
			["filePath", "content"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/SaveUserAssetsBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveUserAssetsBase64: ReactorContract<
		SourceParameters<
			"comment" | "content" | "decode" | "filePath",
			"both",
			["filePath", "content"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/SearchUserAssetsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SearchUserAssets: ReactorContract<
		SourceParameters<
			"filePath" | "options" | "search",
			"both",
			["filePath", "search"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/user/fs/UnzipUserAssetFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UnzipUserAssetFile: ReactorContract<
		SourceParameters<"filePath", "both", ["filePath"], 1>,
		boolean,
		false
	>;
}

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

export interface StorageReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/storage/upload/CreateStorageEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateStorageEngine: ReactorContract<
		SourceParameters<
			"global" | "storage" | "storageDetails",
			"both",
			["storage", "storageDetails"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/DeleteFromStorageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteFromStorage: ReactorContract<
		SourceParameters<
			"leaveFolderStructure" | "storage" | "storagePath",
			"both",
			["storage", "storagePath"],
			2
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/GetStorageFileAsBase64Reactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetStorageFileAsBase64: ReactorContract<
		SourceParameters<
			"convertToPdf" | "storage" | "storagePath",
			"both",
			["storage", "storagePath"],
			2
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/ListStoragePathReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListStoragePath: ReactorContract<
		SourceParameters<
			"storage" | "storagePath",
			"both",
			["storage", "storagePath"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/ListStoragePathDetailsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListStoragePathDetails: ReactorContract<
		SourceParameters<
			"storage" | "storagePath",
			"both",
			["storage", "storagePath"],
			2
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/ListStorageVersionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListStorageVersions: ReactorContract<
		SourceParameters<
			"storage" | "storagePath",
			"both",
			["storage", "storagePath"],
			2
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/PullFromStorageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PullFromStorage: ReactorContract<
		SourceParameters<
			"filePath" | "space" | "storage" | "storagePath" | "version",
			"both",
			["storage", "storagePath", "filePath"],
			4
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/PushToStorageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PushToStorage: ReactorContract<
		SourceParameters<
			"filePath" | "metadata" | "space" | "storage" | "storagePath",
			"both",
			["storage", "storagePath", "filePath"],
			4
		>,
		Record<string, unknown> | boolean | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/StorageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Storage: ReactorContract<
		SourceParameters<"storage", "both">,
		{ storageId?: string; storageName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/SyncLocalToStorageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SyncLocalToStorage: ReactorContract<
		SourceParameters<
			"filePath" | "metadata" | "space" | "storage" | "storagePath",
			"both",
			["storage", "storagePath", "filePath"],
			4
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/SyncStorageToLocalReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SyncStorageToLocal: ReactorContract<
		SourceParameters<
			"filePath" | "space" | "storage" | "storagePath",
			"both",
			["storage", "storagePath", "filePath"],
			4
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/storage/UpdateStorageFileMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateStorageFileMetadata: ReactorContract<
		SourceParameters<
			"metadata" | "storage" | "storagePath",
			"both",
			["storage", "storagePath", "metadata"],
			3
		>,
		boolean,
		false
	>;
}

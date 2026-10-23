import type { SelectQueryStructWireOutput } from "./query-output-types";
import type {
	PixelArgument,
	PixelValue,
	RawPixel,
	ReactorContract,
} from "./value-types";

/** A named noun accepts its first value or an explicit list of values. */
type Noun<T> = PixelArgument<T> | readonly PixelArgument<T>[];
type NoParameters = Record<string, never> | readonly [];
type PixelMap = { readonly [key: string]: PixelValue | undefined };
type NumericInput = PixelArgument<number | "NONE">;
type NumericInputs = readonly NumericInput[];
type NumericPair = readonly [first: NumericInput, second: NumericInput];
type NumericVector = PixelArgument<readonly PixelArgument<number>[]>;
type ScalarVector = PixelArgument<readonly PixelArgument<string | number>[]>;
type PositionalInputs = readonly PixelValue[];

/**
 * Columns selected by the two-argument getUserProjectList used by the reactor.
 * Nullable database columns are optional because the default Gson omits nulls.
 * This query does not select permission, visibility, or description.
 * @source Semoss/src/prerna/auth/utils/SecurityProjectUtils.java#getUserProjectList(User,String)
 * @source Semoss/src/prerna/auth/utils/AbstractSecurityUtils.java (PROJECT schema)
 */
interface ProjectListItem {
	project_id?: string;
	project_name?: string;
	project_display_name?: string;
	project_type?: string;
	project_cost?: string;
	project_global?: boolean;
	project_discoverable?: boolean;
	project_is_template?: boolean;
	project_catalog_name?: string;
	project_created_by?: string;
	project_created_by_type?: string;
	project_date_created?: string;
	project_date_last_edited?: string;
	project_portal_published_date?: string;
	project_published_user?: string;
	project_published_user_type?: string;
	project_reactors_compiled_date?: string;
	project_reactors_compiled_user?: string;
	project_reactors_compiled_user_type?: string;
	/** Coalesced integer favorite flag, not a permission level. */
	project_favorite: number;
	low_project_name?: string;
}

/** @source Semoss/src/prerna/auth/AccessToken.java#toProviderMap */
interface UserProviderDetails {
	id: string;
	name: string;
	username: string;
	email: string;
	/** Missing dates are the literal string "null". */
	lastPwdReset: string;
	lastLogin: string;
	accessToken?: string;
	meta?: Record<string, string[]>;
	san?: Record<string, string>;
	groupInfo: { groupType?: string; groups?: string[] };
	userEpoch?: string;
}

/** Provider names are deployment-dependent; signed-out results carry No User. */
interface CurrentUserOutput {
	isAdmin?: boolean;
	"No User"?: string;
	[provider: string]: UserProviderDetails | boolean | string | undefined;
}

type FrameType = "GRID" | "GRAPH" | "R" | "PY" | "NATIVE" | "IGRAPH";

/**
 * A FRAME noun's wire output is this descriptor, not the Java frame object.
 * @source Semoss/src/prerna/sablecc2/PixelStreamUtility.java#processNounMetadata
 */
interface FrameOutput {
	type: FrameType;
	name?: string;
	queryName?: string;
}

/**
 * The model response's toMap envelope, including optional error-response fields.
 * Providers can return text, tool calls, or media; response is not always text.
 * Null values are omitted by the Pixel stream's default Gson instance.
 * @source Semoss/src/prerna/engine/impl/model/responses/AbstractModelEngineResponse.java#toMap
 * @source Semoss/src/prerna/engine/impl/model/responses/AskModelEngineResponse.java#toMap
 * @source Semoss/src/prerna/engine/impl/model/responses/AskErrorModelEngineResponse.java#toMap
 */
interface ModelResponseOutput {
	response?: unknown;
	numberOfTokensInPrompt?: number;
	numberOfTokensInResponse?: number;
	numberOfCacheReadTokens?: number;
	numberOfCacheCreationTokens?: number;
	numberOfThinkingTokens?: number;
	usageRestriction?: Record<string, unknown>;
	usageLimits?: Record<string, unknown>;
	messageId?: string;
	roomId?: string;
	messageType?: string;
	schemaVersion?: number;
	io?: string;
	parts?: unknown[];
	thinking?: string;
	metadata?: Record<string, unknown>;
	error_type?: string;
	code?: number;
	client?: string;
	model?: string;
	traceback?: string;
	reason?: string;
	reason_detail?: string;
}

interface LlmParameters {
	/** Model engine ID; access is checked by the backend. */
	engine: Noun<string>;
	/** Prompt text, required even when paramValues supplies full_prompt. */
	command: Noun<string>;
	context?: Noun<string>;
	/** Defaults to true. */
	useHistory?: Noun<boolean>;
	paramValues?: Noun<PixelMap>;
	roomId?: Noun<string>;
	media?: Noun<string>;
	/** @deprecated Use media; image is the backend's legacy alias. */
	image?: Noun<string>;
	url?: Noun<string>;
}

interface CreateFrameParameters {
	/** Case-insensitive backend frame type; DEFAULT uses server configuration. */
	frameType: Noun<string>;
	/** Whether to replace the insight's current frame; defaults to true. */
	override?: Noun<boolean>;
	alias?: Noun<string>;
}

interface FrameHeaderParameters {
	/** An existing frame expression; omitted means the current insight frame. */
	frame?: Noun<RawPixel>;
	column: Noun<string>;
}

interface RenameColumnParameters {
	frame?: Noun<RawPixel>;
	column: Noun<string>;
	/** Backend ReactorKeysEnum.NEW_COLUMN is spelled newCol. */
	newCol: Noun<string>;
}

/**
 * Audited overrides for the exhaustive source inventory. These describe the
 * successful wire output of a top-level call; runPixel still reports errors.
 * Named keys and requiredness come from execute/read helpers, not only keysToGet.
 */
export interface VerifiedReactorCatalog {
	/**
	 * Lists accessible projects using the legacy query's exact selected columns.
	 * @remarks The declared project argument is accepted but ignored by execute.
	 * @source Semoss/src/prerna/reactor/project/GetProjectListReactor.java
	 */
	GetProjectList: ReactorContract<
		{ project?: Noun<string> } | readonly [project?: PixelArgument<string>],
		ProjectListItem[]
	>;
	/**
	 * Reads signed-in providers and the session's administrator flag.
	 * @source Semoss/src/prerna/reactor/utils/GetCurrentUserReactor.java
	 */
	GetCurrentUser: ReactorContract<
		{ includeToken?: Noun<boolean> } | readonly [],
		CurrentUserOutput
	>;
	/**
	 * Reads provider details without adding the administrator flag.
	 * @source Semoss/src/prerna/reactor/utils/GetUserInfoReactor.java
	 */
	GetUserInfo: ReactorContract<
		{ includeToken?: Noun<boolean> } | readonly [],
		Record<string, UserProviderDetails | string>
	>;
	/**
	 * Returns original names of the insight's distinct frame objects.
	 * @remarks A frame with no original name contributes null to the array.
	 * @source Semoss/src/prerna/reactor/utils/GetFramesReactor.java
	 */
	GetFrames: ReactorContract<NoParameters, (string | null)[]>;
	/**
	 * Tests a frame's aliases and unique header names.
	 * @remarks Positional frame and column arguments are located by noun type,
	 * so either order is accepted.
	 * @source Semoss/src/prerna/reactor/frame/FrameHeaderExistsReactor.java
	 * @source Semoss/src/prerna/reactor/frame/AbstractFrameReactor.java#getFrame
	 */
	FrameHeaderExists: ReactorContract<
		| FrameHeaderParameters
		| readonly [column: PixelArgument<string>, frame?: RawPixel]
		| readonly [frame: RawPixel, column: PixelArgument<string>],
		boolean
	>;
	/**
	 * Reads a positional frame or the insight's current frame.
	 * @remarks The declared named frame key is not read by this reactor.
	 * @source Semoss/src/prerna/reactor/frame/FrameTypeReactor.java
	 * @source Semoss/src/prerna/algorithm/api/DataFrameTypeEnum.java
	 */
	FrameType: ReactorContract<
		Record<string, never> | readonly [frame?: RawPixel],
		FrameType
	>;
	/**
	 * Merges project information with caller-selected metadata and pending access.
	 * @remarks Metadata keys can overwrite base columns, so values remain unknown.
	 * @source Semoss/src/prerna/reactor/security/GetProjectMetadataReactor.java
	 * @source Semoss/src/prerna/auth/utils/SecurityProjectUtils.java#getAggregateProjectMetadata
	 */
	GetProjectMetadata: ReactorContract<
		{ project: Noun<string>; metaKeys?: Noun<string> },
		Record<string, unknown>
	>;
	/**
	 * Calls a model and returns its model-engine response map.
	 * @remarks Named arguments avoid positional strings also becoming media inputs.
	 * @source Semoss/src/prerna/reactor/model/LLMReactor.java
	 */
	LLM: ReactorContract<LlmParameters, ModelResponseOutput>;
	/**
	 * Creates a frame and optionally makes it the insight's current frame.
	 * @source Semoss/src/prerna/reactor/frame/CreateFrameReactor.java
	 * @source Semoss/src/prerna/reactor/frame/FrameFactory.java
	 */
	CreateFrame: ReactorContract<
		| CreateFrameParameters
		| readonly [
				frameType: PixelArgument<string>,
				override?: PixelArgument<boolean>,
				alias?: PixelArgument<string>,
		  ],
		FrameOutput
	>;
	/**
	 * Renames a column in the active R, Python, or relational frame.
	 * @remarks Named keys work for R/Python. Python/relational positional calls
	 * accept two column names followed by an optional frame; R positional calls
	 * include the frame first. R can return a warning string when its metadata
	 * cannot find the column.
	 * @source Semoss/src/prerna/reactor/frame/r/RenameColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/RenameColumnReactor.java
	 * @source Semoss/src/prerna/reactor/frame/rdbms/RenameColumnReactor.java
	 */
	RenameColumn: ReactorContract<
		| RenameColumnParameters
		| readonly [
				column: PixelArgument<string>,
				newCol: PixelArgument<string>,
				frame?: RawPixel,
		  ]
		| readonly [
				frame: RawPixel,
				column: PixelArgument<string>,
				newCol: PixelArgument<string>,
		  ],
		FrameOutput | string
	>;
	/**
	 * Builds selectors from positional constants or raw column/function expressions.
	 * @remarks Named columns changes expression context and is not equivalent.
	 * @source Semoss/src/prerna/reactor/qs/selectors/SelectReactor.java
	 */
	Select: ReactorContract<PositionalInputs, SelectQueryStructWireOutput>;
	/**
	 * Adds positional comparison expressions to a query struct.
	 * @remarks Named filters creates scalar comparisons in a GenericReactor.
	 * @source Semoss/src/prerna/reactor/qs/filter/FilterReactor.java
	 */
	Filter: ReactorContract<readonly RawPixel[], SelectQueryStructWireOutput>;
	/**
	 * Adds positional relationships such as rawPixel("(a, inner.join, b)").
	 * @source Semoss/src/prerna/reactor/qs/JoinReactor.java
	 */
	Join: ReactorContract<readonly RawPixel[], SelectQueryStructWireOutput>;

	/** @source Semoss/src/prerna/reactor/expression/OpSum.java */
	SUM: ReactorContract<NumericInputs, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpMean.java */
	AVERAGE: ReactorContract<NumericInputs, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpMean.java */
	AVG: ReactorContract<NumericInputs, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpMean.java */
	MEAN: ReactorContract<NumericInputs, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpMin.java */
	MIN: ReactorContract<NumericInputs, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpMax.java */
	MAX: ReactorContract<NumericInputs, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpMedian.java */
	MEDIAN: ReactorContract<readonly [NumericInput, ...NumericInput[]], number>;
	/** @source Semoss/src/prerna/reactor/expression/OpPower.java */
	POWER: ReactorContract<NumericPair, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpRound.java */
	ROUND: ReactorContract<NumericPair, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpAbsolute.java */
	ABS: ReactorContract<readonly [NumericInput], number>;
	/** @source Semoss/src/prerna/reactor/expression/OpAbsolute.java */
	ABSOLUTE: ReactorContract<readonly [NumericInput], number>;
	/**
	 * The last positional number is the one-based rank.
	 * @source Semoss/src/prerna/reactor/expression/OpLarge.java
	 */
	LARGE: ReactorContract<
		readonly [NumericInput, NumericInput, ...NumericInput[]],
		number
	>;
	/**
	 * The last positional number is the one-based rank.
	 * @source Semoss/src/prerna/reactor/expression/OpSmall.java
	 */
	SMALL: ReactorContract<
		readonly [NumericInput, NumericInput, ...NumericInput[]],
		number
	>;
	/** @source Semoss/src/prerna/reactor/expression/filter/OpAnd.java */
	AND: ReactorContract<readonly PixelArgument<boolean>[], boolean>;
	/** @source Semoss/src/prerna/reactor/expression/filter/OpOr.java */
	OR: ReactorContract<readonly PixelArgument<boolean>[], boolean>;
	/** @source Semoss/src/prerna/reactor/expression/OpLen.java */
	LEN: ReactorContract<PositionalInputs, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpNotEmpty.java */
	NOTEMPTY: ReactorContract<PositionalInputs, boolean>;
	/** @source Semoss/src/prerna/reactor/expression/OpIsEmpty.java */
	ISEMPTY: ReactorContract<PositionalInputs, boolean>;
	/** @source Semoss/src/prerna/reactor/expression/OpIsObjectEmpty.java */
	ISOBJECTEMPTY: ReactorContract<PositionalInputs, boolean>;
	/** @source Semoss/src/prerna/reactor/expression/OpAsString.java */
	ASSTRING: ReactorContract<PositionalInputs, string>;
	/** @source Semoss/src/prerna/reactor/expression/OpConcat.java */
	CONCAT: ReactorContract<PositionalInputs, string>;
	/** @source Semoss/src/prerna/reactor/expression/OpContains.java */
	CONTAINS: ReactorContract<PositionalInputs, boolean>;
	/** @source Semoss/src/prerna/reactor/expression/OpArrayLength.java */
	ARRAYLENGTH: ReactorContract<PositionalInputs, number>;
	/** @source Semoss/src/prerna/reactor/expression/OpList.java */
	LIST: ReactorContract<PositionalInputs, unknown[]>;
	/** @source Semoss/src/prerna/reactor/expression/OpPaste.java */
	PASTE: ReactorContract<PositionalInputs, string>;
	/** @source Semoss/src/prerna/reactor/expression/OpPaste0.java */
	PASTE0: ReactorContract<PositionalInputs, string>;
	/**
	 * Multiplies corresponding positions of numeric vectors and sums the products.
	 * @source Semoss/src/prerna/reactor/expression/OpSumProduct.java
	 */
	SUMPRODUCT: ReactorContract<
		readonly [NumericVector, ...NumericVector[]],
		number
	>;
	/**
	 * Finds a position in an array, returning -1 when the value is not found.
	 * @remarks Numeric matching expects 32-bit integer values. matchType defaults to 1.
	 * @source Semoss/src/prerna/reactor/expression/OpMatch.java
	 */
	MATCH: ReactorContract<
		readonly [
			value: PixelArgument<string | number>,
			array: ScalarVector,
			matchType?: PixelArgument<-1 | 0 | 1>,
		],
		number
	>;
	/**
	 * Conditionally sums an array, with an optional separate sum array.
	 * @source Semoss/src/prerna/reactor/expression/OpSumIf.java
	 */
	SUMIF: ReactorContract<
		readonly [
			values: ScalarVector,
			criteria: PixelArgument<string | number>,
			sumRange?: NumericVector,
		],
		number
	>;
	/**
	 * Sums a vector using positional criteria-range/criterion pairs.
	 * @remarks Additional arguments alternate between range and criterion.
	 * @source Semoss/src/prerna/reactor/expression/OpSumIfs.java
	 */
	SUMIFS: ReactorContract<
		readonly [
			sumRange: NumericVector,
			criteriaRange: ScalarVector,
			criteria: PixelArgument<string | number>,
			...additionalCriteria: (
				| ScalarVector
				| PixelArgument<string | number>
			)[],
		],
		number
	>;
	/**
	 * Returns the selected branch's value; its wire shape depends on that branch.
	 * @source Semoss/src/prerna/reactor/IfReactor.java
	 */
	IF: ReactorContract<
		readonly [
			condition: PixelArgument<boolean>,
			whenTrue?: PixelValue,
			whenFalse?: PixelValue,
		],
		unknown
	>;
	/**
	 * Returns the first evaluated noun; its output shape depends on that noun.
	 * @remarks The Java implementation does not implement its advertised fallback.
	 * @source Semoss/src/prerna/reactor/expression/IfError.java
	 */
	IFERROR: ReactorContract<readonly [PixelValue, ...PixelValue[]], unknown>;

	// ReactorFactory aliases and directly discovered concrete expression names.
	/** @source Semoss/src/prerna/reactor/expression/OpAbsolute.java */
	Abs: VerifiedReactorCatalog["ABS"];
	/** @source Semoss/src/prerna/reactor/expression/OpAbsolute.java */
	Absolute: VerifiedReactorCatalog["ABS"];
	/** @source Semoss/src/prerna/reactor/expression/filter/OpAnd.java */
	And: VerifiedReactorCatalog["AND"];
	/** @source Semoss/src/prerna/reactor/expression/OpArrayLength.java */
	ArrayLength: VerifiedReactorCatalog["ARRAYLENGTH"];
	/** @source Semoss/src/prerna/reactor/expression/OpAsString.java */
	AsString: VerifiedReactorCatalog["ASSTRING"];
	/** @source Semoss/src/prerna/reactor/expression/OpMean.java */
	Average: VerifiedReactorCatalog["AVERAGE"];
	/** @source Semoss/src/prerna/reactor/expression/OpMean.java */
	Avg: VerifiedReactorCatalog["AVERAGE"];
	/** @source Semoss/src/prerna/reactor/expression/OpConcat.java */
	Concat: VerifiedReactorCatalog["CONCAT"];
	/** @source Semoss/src/prerna/reactor/expression/OpContains.java */
	Contains: VerifiedReactorCatalog["CONTAINS"];
	/** @source Semoss/src/prerna/reactor/IfReactor.java */
	If: VerifiedReactorCatalog["IF"];
	/** @source Semoss/src/prerna/reactor/expression/IfError.java */
	IfError: VerifiedReactorCatalog["IFERROR"];
	/** @source Semoss/src/prerna/reactor/expression/OpIsEmpty.java */
	IsEmpty: VerifiedReactorCatalog["ISEMPTY"];
	/** @source Semoss/src/prerna/reactor/expression/OpIsObjectEmpty.java */
	IsObjectEmpty: VerifiedReactorCatalog["ISOBJECTEMPTY"];
	/** @source Semoss/src/prerna/reactor/expression/OpLarge.java */
	Large: VerifiedReactorCatalog["LARGE"];
	/** @source Semoss/src/prerna/reactor/expression/OpLen.java */
	Len: VerifiedReactorCatalog["LEN"];
	/** @source Semoss/src/prerna/reactor/expression/OpList.java */
	List: VerifiedReactorCatalog["LIST"];
	/** @source Semoss/src/prerna/reactor/expression/OpMatch.java */
	Match: VerifiedReactorCatalog["MATCH"];
	/** @source Semoss/src/prerna/reactor/expression/OpMax.java */
	Max: VerifiedReactorCatalog["MAX"];
	/** @source Semoss/src/prerna/reactor/expression/OpMean.java */
	Mean: VerifiedReactorCatalog["AVERAGE"];
	/** @source Semoss/src/prerna/reactor/expression/OpMedian.java */
	Median: VerifiedReactorCatalog["MEDIAN"];
	/** @source Semoss/src/prerna/reactor/expression/OpMin.java */
	Min: VerifiedReactorCatalog["MIN"];
	/** @source Semoss/src/prerna/reactor/expression/OpNotEmpty.java */
	NotEmpty: VerifiedReactorCatalog["NOTEMPTY"];
	/** @source Semoss/src/prerna/reactor/expression/OpAbsolute.java */
	OpAbsolute: VerifiedReactorCatalog["ABS"];
	/** @source Semoss/src/prerna/reactor/expression/filter/OpAnd.java */
	OpAnd: VerifiedReactorCatalog["AND"];
	/** @source Semoss/src/prerna/reactor/expression/OpArrayLength.java */
	OpArrayLength: VerifiedReactorCatalog["ARRAYLENGTH"];
	/** @source Semoss/src/prerna/reactor/expression/OpAsString.java */
	OpAsString: VerifiedReactorCatalog["ASSTRING"];
	/** @source Semoss/src/prerna/reactor/expression/OpConcat.java */
	OpConcat: VerifiedReactorCatalog["CONCAT"];
	/** @source Semoss/src/prerna/reactor/expression/OpContains.java */
	OpContains: VerifiedReactorCatalog["CONTAINS"];
	/** @source Semoss/src/prerna/reactor/expression/OpIsEmpty.java */
	OpIsEmpty: VerifiedReactorCatalog["ISEMPTY"];
	/** @source Semoss/src/prerna/reactor/expression/OpIsObjectEmpty.java */
	OpIsObjectEmpty: VerifiedReactorCatalog["ISOBJECTEMPTY"];
	/** @source Semoss/src/prerna/reactor/expression/OpLarge.java */
	OpLarge: VerifiedReactorCatalog["LARGE"];
	/** @source Semoss/src/prerna/reactor/expression/OpLen.java */
	OpLen: VerifiedReactorCatalog["LEN"];
	/** @source Semoss/src/prerna/reactor/expression/OpList.java */
	OpList: VerifiedReactorCatalog["LIST"];
	/** @source Semoss/src/prerna/reactor/expression/OpMatch.java */
	OpMatch: VerifiedReactorCatalog["MATCH"];
	/** @source Semoss/src/prerna/reactor/expression/OpMax.java */
	OpMax: VerifiedReactorCatalog["MAX"];
	/** @source Semoss/src/prerna/reactor/expression/OpMean.java */
	OpMean: VerifiedReactorCatalog["AVERAGE"];
	/** @source Semoss/src/prerna/reactor/expression/OpMedian.java */
	OpMedian: VerifiedReactorCatalog["MEDIAN"];
	/** @source Semoss/src/prerna/reactor/expression/OpMin.java */
	OpMin: VerifiedReactorCatalog["MIN"];
	/** @source Semoss/src/prerna/reactor/expression/OpNotEmpty.java */
	OpNotEmpty: VerifiedReactorCatalog["NOTEMPTY"];
	/** @source Semoss/src/prerna/reactor/expression/filter/OpOr.java */
	OpOr: VerifiedReactorCatalog["OR"];
	/** @source Semoss/src/prerna/reactor/expression/OpPaste.java */
	OpPaste: VerifiedReactorCatalog["PASTE"];
	/** @source Semoss/src/prerna/reactor/expression/OpPaste0.java */
	OpPaste0: VerifiedReactorCatalog["PASTE0"];
	/** @source Semoss/src/prerna/reactor/expression/OpPower.java */
	OpPower: VerifiedReactorCatalog["POWER"];
	/** @source Semoss/src/prerna/reactor/expression/OpRound.java */
	OpRound: VerifiedReactorCatalog["ROUND"];
	/** @source Semoss/src/prerna/reactor/expression/OpSmall.java */
	OpSmall: VerifiedReactorCatalog["SMALL"];
	/** @source Semoss/src/prerna/reactor/expression/OpSum.java */
	OpSum: VerifiedReactorCatalog["SUM"];
	/** @source Semoss/src/prerna/reactor/expression/OpSumIf.java */
	OpSumIf: VerifiedReactorCatalog["SUMIF"];
	/** @source Semoss/src/prerna/reactor/expression/OpSumIfs.java */
	OpSumIfs: VerifiedReactorCatalog["SUMIFS"];
	/** @source Semoss/src/prerna/reactor/expression/OpSumProduct.java */
	OpSumProduct: VerifiedReactorCatalog["SUMPRODUCT"];
	/** @source Semoss/src/prerna/reactor/expression/filter/OpOr.java */
	Or: VerifiedReactorCatalog["OR"];
	/** @source Semoss/src/prerna/reactor/expression/OpPaste.java */
	Paste: VerifiedReactorCatalog["PASTE"];
	/** @source Semoss/src/prerna/reactor/expression/OpPaste0.java */
	Paste0: VerifiedReactorCatalog["PASTE0"];
	/** @source Semoss/src/prerna/reactor/expression/OpPower.java */
	Power: VerifiedReactorCatalog["POWER"];
	/** @source Semoss/src/prerna/reactor/expression/OpRound.java */
	Round: VerifiedReactorCatalog["ROUND"];
	/** @source Semoss/src/prerna/reactor/expression/OpSmall.java */
	Small: VerifiedReactorCatalog["SMALL"];
	/** @source Semoss/src/prerna/reactor/expression/OpSum.java */
	Sum: VerifiedReactorCatalog["SUM"];
	/** @source Semoss/src/prerna/reactor/expression/OpSumIf.java */
	SumIf: VerifiedReactorCatalog["SUMIF"];
	/** @source Semoss/src/prerna/reactor/expression/OpSumIfs.java */
	SumIfs: VerifiedReactorCatalog["SUMIFS"];
	/** @source Semoss/src/prerna/reactor/expression/OpSumProduct.java */
	SumProduct: VerifiedReactorCatalog["SUMPRODUCT"];
}

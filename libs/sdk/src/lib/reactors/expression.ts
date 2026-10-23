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

export interface ExpressionReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpAbsolute.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ABS: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpAbsolute.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ABSOLUTE: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/filter/OpAnd.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AND: ReactorContract<SourceParameters<never, "positional">, boolean, false>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpArrayLength.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ARRAYLENGTH: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpAsString.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ASSTRING: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMean.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AVERAGE: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMean.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AVG: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpAbsolute.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Abs: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpAbsolute.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Absolute: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/filter/OpAnd.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	And: ReactorContract<SourceParameters<never, "positional">, boolean, false>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpArrayLength.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ArrayLength: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpAsString.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AsString: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMean.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Average: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMean.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Avg: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpConcat.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CONCAT: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpContains.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CONTAINS: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpConcat.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Concat: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpContains.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Contains: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/IfError.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	IFERROR: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpIsEmpty.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ISEMPTY: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpIsObjectEmpty.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ISOBJECTEMPTY: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/IfError.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	IfError: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpIsEmpty.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	IsEmpty: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpIsObjectEmpty.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	IsObjectEmpty: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpLarge.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LARGE: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpLen.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LEN: ReactorContract<SourceParameters<never, "positional">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpList.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LIST: ReactorContract<
		SourceParameters<never, "positional">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpLarge.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Large: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpLen.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Len: ReactorContract<SourceParameters<never, "positional">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpList.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	List: ReactorContract<
		SourceParameters<never, "positional">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMatch.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MATCH: ReactorContract<
		SourceParameters<never, "positional">,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMax.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MAX: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMean.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MEAN: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMedian.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MEDIAN: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMin.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MIN: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMatch.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Match: ReactorContract<
		SourceParameters<never, "positional">,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMax.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Max: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMean.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Mean: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMedian.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Median: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMin.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Min: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpNotEmpty.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NOTEMPTY: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpNotEmpty.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NotEmpty: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/filter/OpOr.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OR: ReactorContract<SourceParameters<never, "positional">, boolean, false>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpAbsolute.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpAbsolute: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/filter/OpAnd.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpAnd: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpArrayLength.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpArrayLength: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpAsString.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpAsString: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpConcat.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpConcat: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpContains.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpContains: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/filter/OpFilter.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpFilter: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpIsEmpty.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpIsEmpty: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpIsObjectEmpty.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpIsObjectEmpty: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpLarge.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpLarge: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpLen.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpLen: ReactorContract<
		SourceParameters<never, "positional">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpList.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpList: ReactorContract<
		SourceParameters<never, "positional">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMatch.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpMatch: ReactorContract<
		SourceParameters<never, "positional">,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMax.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpMax: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMean.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpMean: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMedian.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpMedian: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpMin.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpMin: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpNotEmpty.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpNotEmpty: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/filter/OpOr.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpOr: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpPaste.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpPaste: ReactorContract<SourceParameters<"sep", "both">, string, false>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpPaste0.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpPaste0: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpPower.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpPower: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpRound.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpRound: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSmall.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpSmall: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSum.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpSum: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSumIf.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpSumIf: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSumIfs.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpSumIfs: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSumProduct.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpSumProduct: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/filter/OpOr.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Or: ReactorContract<SourceParameters<never, "positional">, boolean, false>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpPaste.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PASTE: ReactorContract<SourceParameters<"sep", "both">, string, false>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpPaste0.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PASTE0: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpPower.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	POWER: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpPaste.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Paste: ReactorContract<SourceParameters<"sep", "both">, string, false>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpPaste0.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Paste0: ReactorContract<
		SourceParameters<never, "positional">,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpPower.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Power: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpRound.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ROUND: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpRound.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Round: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSmall.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SMALL: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSum.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SUM: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSumIf.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SUMIF: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSumIfs.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SUMIFS: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSumProduct.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SUMPRODUCT: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSmall.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Small: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSum.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Sum: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSumIf.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SumIf: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSumIfs.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SumIfs: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/expression/OpSumProduct.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SumProduct: ReactorContract<
		SourceParameters<never, "positional">,
		number | null,
		false
	>;
}

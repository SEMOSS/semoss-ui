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

export interface DateReactorCatalog {
	/**
	 * @source Semoss/src/prerna/date/reactor/DateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DATE: ReactorContract<
		SourceParameters<"date" | "format", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/date/reactor/DayReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DAY: ReactorContract<SourceParameters<"days", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/date/reactor/DateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Date: ReactorContract<
		SourceParameters<"date" | "format", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/date/reactor/DateManipulationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DateManipulation: ReactorContract<
		SourceParameters<"date" | "recurrence" | "timeunit" | "type", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/date/reactor/DayReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Day: ReactorContract<SourceParameters<"days", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/date/reactor/MonthReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MONTH: ReactorContract<SourceParameters<"months", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/date/reactor/MonthReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Month: ReactorContract<SourceParameters<"months", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/date/reactor/TimestampReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Timestamp: ReactorContract<
		SourceParameters<"date" | "format", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/date/reactor/WeekReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WEEK: ReactorContract<SourceParameters<"weeks", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/date/reactor/YearReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	YEAR: ReactorContract<SourceParameters<"years", "both">, unknown, false>;
}

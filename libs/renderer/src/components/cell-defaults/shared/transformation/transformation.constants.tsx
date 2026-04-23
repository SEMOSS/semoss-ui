import {
	AlignJustify,
	Calendar,
	CalendarDays,
	CheckSquare,
	KeyRound,
	Merge,
	Minimize2,
	RefreshCw,
	Type,
} from "lucide-react";
import type {
	columnTypes,
	comparator,
	dateUnit,
	joinType,
	operation,
	TransformationDef,
	TransformationTypes,
} from "./transformation.types";

export const operations: operation[] = [
	"==",
	"<",
	">",
	"!=",
	"<=",
	">=",
	"?like",
];

export const comparators: comparator[] = ["==", "!="];

export const joinTypes: joinType[] = [
	{ name: "Full Join", code: "outer.join" },
	{ name: "Inner Join", code: "inner.join" },
	{ name: "Left Join", code: "left.outer.join" },
	{ name: "Right Join", code: "right.outer.join" },
];

export const transformationColumnTypes: columnTypes[] = [
	"STRING",
	"NUMBER",
	"DATE",
];

export const dateUnitTypes: dateUnit[] = ["day", "week", "month", "year"];

export interface TransformationConfig<
	D extends TransformationDef = TransformationDef,
> {
	key: D["key"];
	parameters: D["parameters"];
}

export const Transformations: Record<
	TransformationTypes,
	{
		transformation: TransformationTypes;
		display: string;
		icon: React.FunctionComponent;
		widget: string;
	}
> = {
	uppercase: {
		transformation: "uppercase",
		display: "Uppercase",
		icon: Type,
		widget: "uppercase-transformation",
	},
	"update-row": {
		transformation: "update-row",
		display: "Update Row Values",
		icon: AlignJustify,
		widget: "update-row-transformation",
	},
	"column-type": {
		transformation: "column-type",
		display: "Change Column Type",
		icon: RefreshCw,
		widget: "column-type-transformation",
	},
	"date-difference": {
		transformation: "date-difference",
		display: "Date Difference",
		icon: CalendarDays,
		widget: "date-difference-transformation",
	},
	timestamp: {
		transformation: "timestamp",
		display: "Timestamp",
		icon: Calendar,
		widget: "timestamp-transformation",
	},
	collapse: {
		transformation: "collapse",
		display: "Collapse",
		icon: Minimize2,
		widget: "collapse-transformation",
	},
	"cumulative-sum": {
		transformation: "cumulative-sum",
		display: "Cumulative Sum",
		icon: CheckSquare,
		widget: "cumulative-sum-transformation",
	},
	"encode-column": {
		transformation: "encode-column",
		display: "Encode Column",
		icon: KeyRound,
		widget: "encode-column-transformation",
	},
	join: {
		transformation: "join",
		display: "Join",
		icon: Merge,
		widget: "join-transformation",
	},
};

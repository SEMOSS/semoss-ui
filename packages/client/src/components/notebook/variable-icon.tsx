import {
	Archive,
	Blocks,
	Bolt,
	Bot,
	Database,
	type LucideIcon,
	Notebook,
	PanelsTopLeft,
	Sigma,
} from "lucide-react";
import type { Variable, VariableType } from "@semoss/renderer";
import { EngineSubtypeIcon } from "@semoss/shared";
import { cn } from "@semoss/ui/next";
import VariableArray from "@/assets/img/VariableArray.svg";
import VariableDate from "@/assets/img/VariableDate.svg";
import VariableJSON from "@/assets/img/VariableJSON.svg";
import VariableString from "@/assets/img/VariableString.svg";

export interface EngineRecord {
	engine_id: string;
	engine_name: string;
	engine_type: string;
	engine_subtype: string;
}

export interface EnginesByType {
	models: EngineRecord[];
	databases: EngineRecord[];
	storages: EngineRecord[];
	functions: EngineRecord[];
	vectors: EngineRecord[];
}

const LUCIDE_TYPE_ICONS: Record<string, LucideIcon> = {
	model: Bot,
	database: Database,
	vector: Bolt,
	storage: Archive,
	function: Sigma,
	query: Notebook,
	cell: PanelsTopLeft,
	block: Blocks,
};

const VARIABLE_TYPE_ICONS: Record<string, string> = {
	string: VariableString,
	JSON: VariableJSON,
	date: VariableDate,
	array: VariableArray,
};

const isEngineType = (type: string): boolean =>
	type === "model" ||
	type === "database" ||
	type === "vector" ||
	type === "storage" ||
	type === "function";

/**
 * Constant-typed variables store their value directly on `variable.value`.
 * Pointer types (block/cell/query) and engine types resolve indirectly.
 */
export const isConstantType = (type: string): boolean =>
	type === "string" ||
	type === "number" ||
	type === "JSON" ||
	type === "date" ||
	type === "array";

/**
 * Render a variable's value as a compact, single-line string for inline
 * display in the LHS row. Covers constants (raw stored value) and engine
 * variables (resolved engine name). Returns `null` for pointer types
 * (block/cell/query) or when the value is missing.
 */
export const formatVariableInlineValue = (
	variable: Variable,
	engines: EnginesByType,
): string | null => {
	if (isConstantType(variable.type)) {
		const val = variable.value;
		if (val === undefined || val === null) return null;
		if (typeof val === "string") return val;
		if (typeof val === "number" || typeof val === "boolean") {
			return String(val);
		}
		try {
			return JSON.stringify(val);
		} catch {
			return String(val);
		}
	}
	const engine = findEngineRecord(variable, engines);
	if (engine) return engine.engine_name || engine.engine_id;
	return null;
};

/**
 * Display label for a variable type. SEMOSS uses `query` internally for what
 * users call a "Notebook"; keep the type identifier intact but render the
 * friendlier label in the UI. JSON stays all-caps because it's an acronym.
 */
export const getVariableTypeLabel = (type: string): string => {
	if (!type) return "";
	if (type === "query") return "Notebook";
	if (type === "JSON") return "JSON";
	return type.charAt(0).toUpperCase() + type.slice(1);
};

export const findEngineRecord = (
	variable: Variable,
	engines: EnginesByType,
): EngineRecord | null => {
	if (!isEngineType(variable.type)) return null;
	const list = engines[`${variable.type}s` as keyof EnginesByType];
	if (!list) return null;
	return list.find((e) => e.engine_id === (variable.value as string)) ?? null;
};

interface VariableIconProps {
	variable: Variable;
	engines: EnginesByType;
	className?: string;
}

export const VariableIcon = ({
	variable,
	engines,
	className,
}: VariableIconProps) => {
	if (isEngineType(variable.type)) {
		const engine = findEngineRecord(variable, engines);
		if (engine?.engine_type) {
			return (
				<EngineSubtypeIcon
					engineType={engine.engine_type}
					engineSubtype={engine.engine_subtype}
					alt={`${engine.engine_name} icon`}
					className={cn("size-4 shrink-0 object-contain", className)}
				/>
			);
		}
	}
	return <TypeIcon type={variable.type} className={className} />;
};

interface TypeIconProps {
	type: VariableType | string;
	className?: string;
}

export const TypeIcon = ({ type, className }: TypeIconProps) => {
	const LucideIconForType = LUCIDE_TYPE_ICONS[type];
	if (LucideIconForType) {
		return (
			<LucideIconForType
				className={cn("size-4 shrink-0 text-foreground/70", className)}
			/>
		);
	}
	if (type === "number") {
		return (
			<span
				className={cn(
					"flex size-4 shrink-0 items-center justify-center font-bold text-foreground/70 text-xs",
					className,
				)}
			>
				#
			</span>
		);
	}
	const svgSrc = VARIABLE_TYPE_ICONS[type];
	if (svgSrc) {
		return (
			<img
				src={svgSrc}
				alt={type}
				className={cn("size-4 shrink-0", className)}
			/>
		);
	}
	return null;
};

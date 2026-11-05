import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	parseSqlQueryPolicyDefaults,
	sqlQueryPolicyDefaultsQuery,
} from "@/api/guardrails";
import { type BuiltInRules, toBuiltInRulesByPolicy } from "./sql-query-policy";

/** Options for {@link useSqlPolicyBuiltIns}. */
export interface UseSqlPolicyBuiltInsOptions {
	/** The SQL_DIALECT whose built-in rules are read. */
	dialect: string;
	/** The insight the read runs in. */
	insightId?: string;
	/**
	 * Called once a dialect's built-in rules were read, or could not be, with
	 * the ones the lists showed before, so the lists can swap one for the other.
	 * A read that failed gives no built-in rules.
	 */
	onChange: (next: BuiltInRules, previous: BuiltInRules) => void;
}

/** What {@link useSqlPolicyBuiltIns} returns. */
export interface SqlPolicyBuiltIns {
	/** The built-in rules the lists show, by identifier policy. */
	builtIns: BuiltInRules;
	/**
	 * Whether the chosen dialect's built-in rules are being read, were read, or
	 * could not be read.
	 */
	status: "LOADING" | "READY" | "ERROR";
	/** Reads the chosen dialect's built-in rules again. */
	refresh: () => void;
}

/**
 * Reads the SQL query policy guardrail's built-in identifier rules for the
 * chosen dialect, again whenever the dialect changes, and hands each new set
 * to {@link UseSqlPolicyBuiltInsOptions.onChange}. A read for a dialect that
 * was already left is ignored.
 *
 * @param options - The dialect, the insight, and what to do with the rules.
 * @returns The built-in rules shown, the read's status and a way to read again.
 */
export const useSqlPolicyBuiltIns = ({
	dialect,
	insightId,
	onChange,
}: UseSqlPolicyBuiltInsOptions): SqlPolicyBuiltIns => {
	const [builtIns, setBuiltIns] = useState<BuiltInRules>({});
	// the dialect the last read finished for, and whether its rules were read
	const [lastRead, setLastRead] = useState<{
		dialect: string;
		isRead: boolean;
	} | null>(null);

	const show = (next: BuiltInRules, isRead: boolean) => {
		onChange(next, builtIns);
		setBuiltIns(next);
		setLastRead({ dialect, isRead });
	};

	const read = usePixel<unknown>(
		sqlQueryPolicyDefaultsQuery(dialect),
		{
			onSuccess: (output) => {
				try {
					show(
						toBuiltInRulesByPolicy(
							parseSqlQueryPolicyDefaults(output),
						),
						true,
					);
				} catch (error: unknown) {
					console.error(error);
					show({}, false);
				}
			},
			onError: (_data, error) => {
				console.error(error);
				show({}, false);
			},
		},
		insightId,
	);

	const isSettled = read.status === "SUCCESS" || read.status === "ERROR";
	const status: SqlPolicyBuiltIns["status"] =
		!isSettled || lastRead?.dialect !== dialect
			? "LOADING"
			: lastRead.isRead
				? "READY"
				: "ERROR";

	return { builtIns, status, refresh: read.refresh };
};

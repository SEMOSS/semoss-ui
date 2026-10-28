import type { ReactElement, ReactNode } from "react";

export interface ServedModelFactProps {
	/** What the fact is, such as "Runtime" */
	term: string;
	/** Its value; nothing renders when it is null or empty */
	children: ReactNode;
}

/** One term and its value in a served model's description list. */
export function ServedModelFact({
	term,
	children,
}: ServedModelFactProps): ReactElement | null {
	if (children === null || children === undefined || children === "") {
		return null;
	}
	return (
		<>
			<dt className="text-muted-foreground text-sm">{term}</dt>
			<dd className="min-w-0 break-words text-sm sm:col-span-2">
				{children}
			</dd>
		</>
	);
}

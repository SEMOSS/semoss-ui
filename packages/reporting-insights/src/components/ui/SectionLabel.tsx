/** The small uppercase caption used above form sections / tool groups. */

import type { ReactNode } from "react";
import { cx } from "./cx";

export function SectionLabel({
	children,
	optional,
	className,
}: {
	children: ReactNode;
	optional?: boolean;
	className?: string;
}) {
	return (
		<p
			className={cx(
				"font-semibold text-[10px] text-stone-400 uppercase tracking-widest",
				className,
			)}
		>
			{children}
			{optional && (
				<span className="ml-1 font-normal text-stone-300 normal-case">
					optional
				</span>
			)}
		</p>
	);
}

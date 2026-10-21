import { Direction } from "radix-ui";
import type { ReactNode } from "react";

/** Gives shared Radix controls the same reading and keyboard direction as the host. */
export function DirectionProvider({
	dir,
	children,
}: {
	dir: "ltr" | "rtl";
	children: ReactNode;
}) {
	return <Direction.Provider dir={dir}>{children}</Direction.Provider>;
}

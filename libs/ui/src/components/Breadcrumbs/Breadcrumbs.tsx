import { Breadcrumbs as MuiBreadcrumbs, type SxProps } from "@mui/material";
import type { ReactNode } from "react";

export interface BreadcrumbsProps {
	/** children to be rendered */
	children?: ReactNode;

	/** custom style object */
	sx?: SxProps;

	/**
	 * If max items is exceeded, the number of items to show after the ellipsis.
	 * @default 1
	 */
	itemsAfterCollapse?: number;

	/**
	 * If max items is exceeded, the number of items to show before the ellipsis.
	 * @default 1
	 */
	itemsBeforeCollapse?: number;

	/**
	 * Specifies the maximum number of breadcrumbs to display. When there are more
	 * than the maximum number, only the first `itemsBeforeCollapse` and last `itemsAfterCollapse`
	 * will be shown, with an ellipsis in between.
	 * @default 8
	 */
	maxItems?: number;

	/**
	 * Custom separator node.
	 * @default '/'
	 */
	separator?: React.ReactNode;
}
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
	children,
	sx,
	separator = "/",
	...otherProps
}) => {
	return (
		<MuiBreadcrumbs sx={sx} separator={separator} {...otherProps}>
			{children}
		</MuiBreadcrumbs>
	);
};

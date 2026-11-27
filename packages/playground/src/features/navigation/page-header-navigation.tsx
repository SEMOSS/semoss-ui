import { useContext, useEffect } from "react";
import { NavigationButton } from "./navigation-button";
import { PageHeaderContext } from "./page-header.context";

/**
 * A page header's navigation button. It registers the header with the layout,
 * which then drops its floating button; outside that layout it renders nothing.
 */
export const PageHeaderNavigation = () => {
	const registerPageHeader = useContext(PageHeaderContext);

	// the registration's return value is the effect's cleanup
	useEffect(() => registerPageHeader?.(), [registerPageHeader]);

	return registerPageHeader ? <NavigationButton placement="inline" /> : null;
};

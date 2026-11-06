import { useContext, useEffect } from "react";
import { MobileNavigationButton } from "./mobile-navigation-button";
import { PageHeaderContext } from "./page-header.context";

/**
 * The mobile navigation button for a route's own header, such as a room's.
 * Inside the main layout it registers the header, so the layout drops its
 * floating button; outside it, it renders nothing.
 *
 * @component
 */
export const PageHeaderNavigation = () => {
	const registerPageHeader = useContext(PageHeaderContext);

	useEffect(() => registerPageHeader?.(), [registerPageHeader]);

	// only a layout that takes the header's place for it has navigation
	return registerPageHeader ? (
		<MobileNavigationButton placement="inline" />
	) : null;
};

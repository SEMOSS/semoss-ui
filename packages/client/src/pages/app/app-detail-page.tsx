import { AppDetailLayout } from "./app-detail-layout";

interface AppDetailsProps {
	showNav?: boolean;
	excludeTabs?: string[];
}

export const AppDetailPage = ({
	showNav = true,
	excludeTabs,
}: AppDetailsProps) => {
	return (
		<AppDetailLayout embedded showNav={showNav} excludeTabs={excludeTabs} />
	);
};

import { AppDetailLayout } from "./app-detail-layout";

interface AppDetailsProps {
	showNav?: boolean;
}

export const AppDetailPage = ({ showNav = true }: AppDetailsProps) => {
	return <AppDetailLayout embedded showNav={showNav} />;
};

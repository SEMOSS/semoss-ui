import { observer } from "mobx-react-lite";
import { useLocation } from "react-router-dom";
import { Help } from "@/components/help";
import { Sidebar } from "./app-sidebar";
import { Navbar } from "./Navbar";
import { PlatformMessages } from "./platform-messages";

export interface PageProps {
	/** Content to include in the main section of the page */
	children: React.ReactNode;
}

export const Page: React.FC<PageProps> = observer(({ children }) => {
	const location = useLocation();

	// Check if current route is an InsightBuilder page
	const isInsightBuilderPage =
		location.pathname === "/app/new/insight" ||
		location.pathname.match(/^\/app\/[^/]+\/insight\/edit$/);

	// Use full width for InsightBuilder pages, default maxWidth for others
	const containerClassName = isInsightBuilderPage
		? "mx-auto h-full w-full px-4 pt-6 sm:px-6 md:px-8 lg:px-10 xl:px-12"
		: "mx-auto w-full max-w-[1550px] px-4 pt-6 sm:px-6 md:px-8 lg:px-10 xl:px-12";

	return (
		<div className="relative flex h-screen w-screen overflow-hidden">
			<Sidebar />
			<div className="relative h-full w-full flex-1 overflow-hidden pt-14">
				<Navbar />
				<div
					className="relative h-full w-full overflow-y-auto overflow-x-hidden"
					data-home-content="true"
				>
					<div
						className={containerClassName}
						data-home-container="true"
					>
						{children}
					</div>
				</div>
			</div>
			<PlatformMessages />
			<Help />
		</div>
	);
});

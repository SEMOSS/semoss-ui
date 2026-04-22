import { observer } from "mobx-react-lite";
import { Help } from "@/components/help";
import { Sidebar } from "./app-sidebar";
import { Navbar } from "./Navbar";
import { PlatformMessages } from "./platform-messages";

export interface PageProps {
	/** Content to include in the main section of the page */
	children: React.ReactNode;
}

export const Page: React.FC<PageProps> = observer(({ children }) => {
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
						className="mx-auto w-full max-w-[1550px] px-4 pt-6 sm:px-6 md:px-8 lg:px-10 xl:px-12"
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

import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@semoss/ui/next";
import { Header } from "@/components/header";
import { AppSidebar } from "@/components/sidebar";

export const MainLayout = () => {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<Header />
				<div className="flex flex-1 flex-col gap-4 p-4">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};

import {
	FileText,
	LayoutDashboard,
	Menu,
	PlayCircle,
	Settings,
	Workflow,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@semoss/ui/next";

const menuItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboard,
	},
	{
		title: "Rules",
		url: "/rules",
		icon: FileText,
	},
	{
		title: "Visualize Rules",
		url: "/visualize-rules",
		icon: Workflow,
	},
	{
		title: "Validate Rules",
		url: "/validate-rules",
		icon: PlayCircle,
	},
	{
		title: "Settings",
		url: "/settings",
		icon: Settings,
	},
];

export const AppSidebar = () => {
	const location = useLocation();

	return (
		<Sidebar>
			<SidebarHeader className="border-b p-4">
				<div className="flex items-center gap-2">
					<Menu className="h-5 w-5" />
					<span className="font-semibold text-lg">VRB</span>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={
											location.pathname === item.url
										}
									>
										<Link to={item.url}>
											<item.icon className="h-4 w-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="border-t p-4">
				<p className="text-muted-foreground text-xs">
					Visual Rule Builder v1.0
				</p>
			</SidebarFooter>
		</Sidebar>
	);
};

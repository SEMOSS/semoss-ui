"use client";

import { CogIcon, EllipsisVerticalIcon, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@semoss/ui/next";

export function NavUser() {
	const { isMobile } = useSidebar();
	const { system, actions } = useInsight();

	const navigate = useNavigate();

	const loginType = Object.keys(system.config.logins)[0];
	const userName: string =
		typeof system.config.logins[loginType] === "string"
			? (system.config.logins[loginType] as unknown as string)
			: "";

	const initials: string = userName
		.match(/(\b\S)?/g)
		.join("")
		.match(/(^\S|\S$)?/g)
		.join("")
		.toUpperCase();

	return (
		<SidebarMenu className="gap-2 group-data-[collapsible=icon]:p-2">
			<SidebarMenuItem>
				<DropdownMenu>
					<SidebarMenuButton
						size="lg"
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						asChild
					>
						<DropdownMenuTrigger className="flex w-full items-center gap-2">
							<Avatar className="h-8 w-8 flex-shrink-0 rounded-lg grayscale">
								<AvatarImage src={""} alt={userName} />
								<AvatarFallback className="rounded-lg">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="flex min-w-0 flex-1 items-center">
								<span className="truncate font-medium text-sm">
									{userName}
								</span>
							</div>
							<EllipsisVerticalIcon className="ml-auto size-4 flex-shrink-0" />
						</DropdownMenuTrigger>
					</SidebarMenuButton>

					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuItem asChild>
							<Link to="/settings">
								<CogIcon />
								Settings
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={async () => {
								await actions.logout();

								navigate("/login");
							}}
						>
							<LogOut />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

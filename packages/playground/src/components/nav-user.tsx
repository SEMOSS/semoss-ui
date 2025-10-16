"use client";

import { EllipsisVerticalIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
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
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<SidebarMenuButton
						size="lg"
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						asChild
					>
						<DropdownMenuTrigger>
							<Avatar className="h-8 w-8 rounded-lg grayscale">
								<AvatarImage src={""} alt={userName} />
								<AvatarFallback className="rounded-lg">
									CN
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{userName}
								</span>
								<span className="truncate text-muted-foreground text-xs">
									&nbsp;
								</span>
							</div>
							<EllipsisVerticalIcon className="ml-auto size-4" />
						</DropdownMenuTrigger>
					</SidebarMenuButton>

					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={""} alt={userName} />
									<AvatarFallback className="rounded-lg">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{userName}
									</span>
									<span className="truncate text-xs">
										&nbsp;
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
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

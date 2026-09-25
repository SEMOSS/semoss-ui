import {
	House,
	LayoutGrid,
	MessagesSquare,
	SquarePen,
	Users,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import {
	Button,
	cn,
	SidebarHeader as SidebarHeaderPrimitive,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useSidebar,
} from "@semoss/ui/next";

/** The sidebar's brand wordmark and primary navigation. */
export function SidebarHeader({ condensed }: { condensed?: boolean }) {
	const { pathname } = useLocation();
	const { isMobile, setOpenMobile } = useSidebar();
	const newChatActive = pathname === "/new";
	const overviewActive = pathname === "/";
	const sessionsActive =
		pathname === "/room" || pathname.startsWith("/room/");
	const agentsActive = pathname.startsWith("/agents");
	const handleNavigation = () => {
		if (isMobile) setOpenMobile(false);
	};

	return (
		<SidebarHeaderPrimitive
			className={
				condensed
					? "items-center gap-0 px-2 py-4 transition-[padding,gap,opacity] duration-300 ease-in-out"
					: "px-3 py-6 transition-[padding,gap,opacity] duration-300 ease-in-out"
			}
		>
			<Link
				to="/"
				aria-label="Teamwork home"
				className={
					condensed
						? "mb-6 flex items-center justify-center px-0 font-semibold text-2xl transition-all duration-300 ease-in-out"
						: "mb-8 flex items-center gap-2.5 px-2 font-semibold text-2xl transition-all duration-300 ease-in-out"
				}
			>
				<span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary bg-primary text-primary-foreground">
					<LayoutGrid className="size-4.5" aria-hidden="true" />
				</span>
				{!condensed && (
					<span>
						collaboration<span className="text-primary">.</span>
					</span>
				)}
			</Link>
			<nav className="w-full" aria-label="Main navigation">
				<SidebarMenu>
					<SidebarMenuItem className="flex justify-center">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									asChild
									size="sm"
									className={cn(
										"mx-auto mb-2 w-full justify-center",
										condensed &&
											"min-h-11 min-w-11 max-w-11 px-0",
										newChatActive &&
											"bg-primary text-primary-foreground hover:bg-primary/90",
									)}
								>
									<Link
										to="/new"
										aria-label="New Chat"
										aria-current={
											newChatActive ? "page" : undefined
										}
										onClick={handleNavigation}
									>
										<SquarePen aria-hidden="true" />
										{!condensed && <span>New Chat</span>}
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent
								side="right"
								hidden={!condensed || isMobile}
							>
								New Chat
							</TooltipContent>
						</Tooltip>
					</SidebarMenuItem>
					{[
						{
							to: "/",
							label: "Overview",
							icon: House,
							active: overviewActive,
						},
						{
							to: "/room",
							label: "Sessions",
							icon: MessagesSquare,
							active: sessionsActive,
						},
						{
							to: "/agents",
							label: "Agents",
							icon: Users,
							active: agentsActive,
						},
					].map(({ to, label, icon: Icon, active }) => (
						<SidebarMenuItem
							className={
								condensed ? "flex justify-center" : undefined
							}
							key={to}
						>
							<SidebarMenuButton
								aria-current={active ? "page" : undefined}
								isActive={active}
								tooltip={label}
								className={
									condensed
										? "h-10 items-center justify-center gap-0 px-0"
										: "h-9 px-3"
								}
								asChild
							>
								<Link
									to={to}
									aria-label={label}
									onClick={handleNavigation}
								>
									<Icon
										className={
											condensed ? "mx-0" : undefined
										}
										aria-hidden="true"
									/>
									{!condensed && <span>{label}</span>}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</nav>
		</SidebarHeaderPrimitive>
	);
}

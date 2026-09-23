import { House, LayoutGrid, MessagesSquare, Users } from "lucide-react";
import { Link, useLocation } from "react-router";
import {
	SidebarHeader as SidebarHeaderPrimitive,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@semoss/ui/next";

/** The sidebar's brand wordmark and primary navigation. */
export function SidebarHeader({ condensed }: { condensed?: boolean }) {
	const { pathname } = useLocation();
	const overviewActive = pathname === "/";
	const sessionsActive =
		pathname === "/room" || pathname.startsWith("/room/");
	const agentsActive = pathname.startsWith("/agents");

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
					<LayoutGrid className="size-4.5" />
				</span>
				{!condensed && (
					<span>
						collaboration<span className="text-link">.</span>
					</span>
				)}
			</Link>
			<nav className="w-full" aria-label="Main navigation">
				<SidebarMenu>
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
								<Link to={to} aria-label={label}>
									<Icon
										className={
											condensed ? "mx-0" : undefined
										}
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

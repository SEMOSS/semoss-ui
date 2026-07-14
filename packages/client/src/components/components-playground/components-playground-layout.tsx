import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@semoss/ui/next";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { COMPONENT_GROUPS, COMPONENT_REGISTRY } from "./component-registry";
import { EngineConnectBar } from "./engine-connect-bar";
import { EngineConnectProvider } from "./engine-connect-provider";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	cn(
		"rounded-md px-3 py-1.5 text-sm transition-colors",
		isActive
			? "bg-accent font-medium text-accent-foreground"
			: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
	);

/** Persistent sidebar + content shell for /components/playground. No
 * existing "vertical nav list" precedent in packages/client (settings uses a
 * card-grid + horizontal tabs) — built from scratch to match the requested
 * shadcn/ui-style reference layout. */
export const ComponentsPlaygroundLayout = () => {
	return (
		<EngineConnectProvider>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex flex-col gap-6 pt-2">
				<EngineConnectBar />
				<div className="flex flex-col gap-8 md:flex-row">
					<nav className="flex shrink-0 flex-col gap-4 md:w-56">
						<NavLink
							to="/components/playground"
							end
							className={navLinkClass}
						>
							Overview
						</NavLink>
						{COMPONENT_GROUPS.map((group) => {
							const entries = COMPONENT_REGISTRY.filter(
								(e) => e.group === group,
							);
							if (entries.length === 0) return null;
							return (
								<div
									key={group}
									className="flex flex-col gap-1"
								>
									<span className="px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
										{group}
									</span>
									{entries.map((entry) => (
										<NavLink
											key={entry.slug}
											to={`/components/playground/${entry.slug}`}
											className={navLinkClass}
										>
											{entry.title}
										</NavLink>
									))}
								</div>
							);
						})}
					</nav>
					<div className="min-w-0 flex-1">
						<Outlet />
					</div>
				</div>
			</div>
		</EngineConnectProvider>
	);
};

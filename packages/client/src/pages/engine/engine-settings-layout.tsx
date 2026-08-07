import { AlignLeftIcon, SlidersHorizontalIcon, TagsIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router";

const SETTINGS_SECTIONS = [
	{
		name: "Model Settings",
		path: "model",
		icon: SlidersHorizontalIcon,
		description: "Capability, modalities, and limits",
	},
	{
		name: "Tags",
		path: "tags",
		icon: TagsIcon,
		description: "Tags, classification, and domain",
	},
	{
		name: "Description",
		path: "description",
		icon: AlignLeftIcon,
		description: "Summary and About content",
	},
];

/**
 * Layout for the engine Settings tab: a small left sidebar that switches
 * between the settings sections, with the active section rendered beside it.
 */
export const EngineSettingsLayout = () => {
	return (
		<div className="flex flex-col gap-6 lg:flex-row lg:gap-0">
			<nav
				aria-label="Engine settings sections"
				className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto lg:w-60 lg:flex-col lg:pr-6"
			>
				{SETTINGS_SECTIONS.map((item) => (
					<NavLink
						key={item.path}
						to={item.path}
						data-testid={`engine-settings-layout--${item.path}-link`}
						className={({ isActive }) =>
							[
								"flex shrink-0 items-start gap-3 rounded-md px-3 py-2 transition-colors",
								isActive
									? "bg-muted text-foreground"
									: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
							].join(" ")
						}
					>
						<item.icon className="mt-0.5 size-4 shrink-0" />
						<span className="flex min-w-0 flex-col">
							<span className="truncate font-medium text-sm">
								{item.name}
							</span>
							<span className="hidden truncate text-muted-foreground text-xs lg:block">
								{item.description}
							</span>
						</span>
					</NavLink>
				))}
			</nav>
			<div className="min-w-0 flex-1 lg:border-border lg:border-l lg:pl-8">
				<Outlet />
			</div>
		</div>
	);
};

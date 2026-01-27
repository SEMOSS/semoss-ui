import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
	H2,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { SETTINGS_ROUTES } from "./settings-router";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const SettingsLayout = () => {
	const navigate = useNavigate();

	const { pathname } = useLocation();

	// assume it starts with /settings
	const relativePath = pathname.slice("/settings".length).replace(/^\//, "");

	return (
		<ScrollArea className="h-full w-full">
			<div className="container mx-auto px-4 md:px-6">
				<div className="mt-4 flex w-full items-center justify-between">
					<H2>Settings</H2>

					{/* Mobile-only dropdown */}
					<div className="md:hidden">
						<Select
							value={relativePath}
							onValueChange={(value) => {
								console.log(value);
								navigate(value);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select setting" />
							</SelectTrigger>
							<SelectContent>
								{SETTINGS_ROUTES.map((route) => {
									if (!route.id) {
										return null;
									}

									return (
										<SelectItem
											key={route.path}
											value={route.path}
										>
											{route.id}
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="flex flex-col md:flex-row">
					{/* Sidebar - hidden on mobile, no border */}
					<aside className="hidden w-64 py-6 pr-6 md:block">
						<ul className="-ml-3 space-y-1">
							{SETTINGS_ROUTES.map((route) => {
								if (!route.id) {
									return null;
								}

								return (
									<NavLink key={route.path} to={route.path}>
										{({ isActive }) => (
											<li
												className={`cursor-pointer rounded-md px-3 py-2 font-medium text-sm hover:bg-accent-foreground/10 ${
													isActive
														? "bg-accent-foreground/5 text-accent-foreground"
														: "text-muted-foreground"
												}`}
											>
												{route.id}
											</li>
										)}
									</NavLink>
								);
							})}
						</ul>
					</aside>

					{/* Main content */}
					<main className="flex-1 py-4 md:py-6">
						<ScrollArea className="h-full w-full">
							<Outlet />
						</ScrollArea>
					</main>
				</div>
			</div>
		</ScrollArea>
	);
};

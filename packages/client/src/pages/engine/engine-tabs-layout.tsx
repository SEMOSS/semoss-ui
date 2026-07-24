import { ChevronRightIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import { useMemo } from "react";
import {
	Link,
	matchPath,
	Navigate,
	Outlet,
	useLocation,
	useResolvedPath,
} from "react-router-dom";
import type { Role } from "@semoss/shared";
import { EngineSubtypeIcon, EntityHeader } from "@semoss/shared";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { EngineAccessButton, EngineExportButton } from "@/components/engine";
import { useEngine } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

interface EngineTabsLayoutProps {
	tabs: {
		/** Name of the specific page */
		name: string;

		/** Path of the specific page */
		path: string;

		/** Restrict to certain roles */
		restrict: Role[];
	}[];
}

/**
 * Wrap the engine routes and add additional funcitonality
 */
export const EngineTabsLayout: React.FC<EngineTabsLayoutProps> = ({ tabs }) => {
	const resolvedPath = useResolvedPath("");
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { catalog, engine, permission, type } = useEngine();

	// get the visible tabs based on permission
	const visibleTabs = useMemo(() => {
		// get the routes based on permission
		return tabs.filter((tab) => {
			if (!tab.restrict || tab.restrict.length === 0) {
				return true;
			}
			if (!permission) {
				return false;
			}
			return tab.restrict.includes(permission);
		});
	}, [tabs, permission]);

	/**
	 * Gets active tab
	 * @returns index of selectedTab
	 */
	const activeTabIdx: number = useMemo(() => {
		for (
			let tabIdx = 0, tabLen = visibleTabs.length;
			tabIdx < tabLen;
			tabIdx++
		) {
			if (
				matchPath(
					`${resolvedPath.pathname}/${visibleTabs[tabIdx].path}`,
					pathname,
				)
			) {
				return tabIdx;
			}
		}

		return -1;
	}, [visibleTabs, resolvedPath, pathname]);

	if (activeTabIdx === -1 && visibleTabs.length > 0) {
		navigate(`${resolvedPath.pathname}/${visibleTabs[0].path}`);
	}

	if (activeTabIdx === -1) {
		return (
			<Navigate
				to={`${resolvedPath.pathname}/${visibleTabs[0].path}`}
				replace
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex w-full flex-col items-start gap-4 p-0">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link
									to={catalog.path}
									className="inline-flex items-center text-inherit leading-none"
								>
									{catalog.name} Catalog
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator className="inline-flex items-center [&>svg]:translate-y-[0.5px]">
							<ChevronRightIcon />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage className="inline-flex items-center leading-none">
								{engine.engine_display_name ||
									engine.engine_name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<EntityHeader
					icon={
						<EngineSubtypeIcon
							engineType={type}
							engineSubtype={engine.engine_subtype}
							alt={catalog.name}
							className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
						/>
					}
					name={engine.engine_display_name || engine.engine_name}
					id={engine.engine_id}
					copyLabel={`Copy ${name} ID`}
					nameTestId="Title"
					idTestId={`engineHeader-${name}-id`}
					copyTestId={`engineHeader-copy-${name}-id-btn`}
					actions={
						<>
							<EngineAccessButton />

							<EngineExportButton />
							{(permission === "OWNER" ||
								permission === "EDIT" ||
								permission === "READ_ONLY") && (
								<Button
									variant="default"
									data-testid="engine-tabs-layout--open-btn"
									asChild
								>
									<Link to="./workbench">
										<SquareArrowOutUpRightIcon className="size-4" />
										Workbench
									</Link>
								</Button>
							)}
						</>
					}
				/>
			</div>
			<div className="flex flex-col rounded-lg bg-(--muted)">
				{visibleTabs.length > 0 && (
					<div>
						<Tabs
							value={
								activeTabIdx !== -1
									? visibleTabs[activeTabIdx].path
									: undefined
							}
							className="gap-0 bg-transparent"
						>
							<div className="w-full overflow-x-auto md:w-[80%]">
								<TabsList className="w-max flex-nowrap gap-2">
									{visibleTabs.map((t) => (
										<TabsTrigger
											key={t.path}
											value={t.path}
											onClick={() =>
												navigate(`${t.path}`)
											}
											data-testid={`engineLayout-${t.name}-tab`}
										>
											{t.name}
										</TabsTrigger>
									))}
								</TabsList>
							</div>
						</Tabs>
					</div>
				)}
				<div className="w-full bg-(--card) p-4">
					<Outlet />
				</div>
			</div>
		</div>
	);
};

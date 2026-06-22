import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Env, post } from "@semoss/sdk/react";
import { Input, Spinner, toast } from "@semoss/ui/next";
import { SEMOSS } from "@/assets/img/SEMOSS";
import { EngineLandscapeCard } from "@/components/engine";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { usePixel, useRootStore, useSettings } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

export interface InsightInterface {
	project_id?: string;
	app_id?: string;
	project_insight_id?: string;
	app_insight_id?: string;
	insight_id?: string;
	insight_insight_id?: string;
	name?: string;
	insight_name?: string;
	description?: string;
	created_on?: string;
	permission?: number | string;
	insight_permission?: number | string;
	insight_global?: boolean | string | number;
	tags?: string[];
}

const escapePixelString = (value: string) => {
	return value.replaceAll("'", "\\'");
};

const isTruthyGlobal = (value: InsightInterface["insight_global"]) => {
	return value === true || value === "true" || value === 1 || value === "1";
};

const isOwnerPermission = (permission?: number | string | null) => {
	return permission === 1 || permission === "OWNER";
};

const formatInsightName = (name?: string) => {
	if (!name) {
		return "Untitled Insight";
	}

	return name
		.split("_")
		.map((fragment) => {
			return fragment.charAt(0).toUpperCase() + fragment.slice(1);
		})
		.join(" ");
};

const resolveInsightId = (insight: InsightInterface) => {
	return (
		insight.project_insight_id ||
		insight.insight_id ||
		insight.app_insight_id ||
		insight.insight_insight_id ||
		""
	);
};

const resolveProjectId = (insight: InsightInterface) => {
	return insight.project_id || insight.app_id || "";
};

const resolveInsightName = (insight: InsightInterface) => {
	return formatInsightName(insight.name || insight.insight_name);
};

const resolveInsightPermission = (insight: InsightInterface) => {
	return insight.permission || insight.insight_permission;
};

export const InsightSettingsPage = () => {
	const navigate = useNavigate();
	const { adminMode } = useSettings();
	const { monolithStore } = useRootStore();

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [insights, setInsights] = useState<InsightInterface[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isDeletingInsight, setIsDeletingInsight] = useState(false);
	const [insightToDelete, setInsightToDelete] = useState<{
		projectId: string;
		insightId: string;
		name: string;
	} | null>(null);

	useEffect(() => {
		setIsSearching(true);
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setIsSearching(false);
		}, 400);

		return () => {
			clearTimeout(timer);
		};
	}, [search]);

	const getInsights = usePixel<InsightInterface[]>(
		`GetInsights(filterWord=["${debouncedSearch}"], onlyFavorites=[false], sort=["name"]);`,
		{
			data: [],
		},
	);

	useEffect(() => {
		if (getInsights.status !== "SUCCESS") {
			return;
		}

		setInsights(getInsights.data || []);
	}, [getInsights.status, getInsights.data]);

	const setInsightGlobal = async (insight: InsightInterface) => {
		const projectId = resolveProjectId(insight);
		const insightId = resolveInsightId(insight);
		if (!projectId || !insightId) {
			toast.error("Missing insight identifiers");
			return;
		}

		const currentGlobal = isTruthyGlobal(insight.insight_global);
		let url = `${Env.MODULE}/api/auth/`;
		if (adminMode) {
			url += "admin/";
		}
		url += "insight/setInsightGlobal";

		try {
			const response = await post<{ success: boolean }>(
				url,
				{
					projectId,
					insightId,
					isPublic: !currentGlobal,
				},
				{},
			);

			if (response.data?.success || response.data) {
				setInsights((prev) => {
					return prev.map((row) => {
						const rowInsightId = resolveInsightId(row);
						const rowProjectId = resolveProjectId(row);
						if (
							rowInsightId === insightId &&
							rowProjectId === projectId
						) {
							return {
								...row,
								insight_global: !currentGlobal,
							};
						}
						return row;
					});
				});
				toast.success(
					`Successfully made ${resolveInsightName(insight)} ${
						currentGlobal ? "private" : "public"
					}`,
				);
			} else {
				toast.error("Failed to update insight visibility");
			}
		} catch (error) {
			toast.error(String(error));
		}
	};

	const deleteInsight = async () => {
		if (!insightToDelete) {
			return;
		}

		try {
			setIsDeletingInsight(true);

			const response = await monolithStore.runQuery(
				`DeleteInsight(project=['${escapePixelString(insightToDelete.projectId)}'], id=['${escapePixelString(insightToDelete.insightId)}']);`,
			);

			const operationType =
				response.pixelReturn?.[0]?.operationType || "";
			const output = response.pixelReturn?.[0]?.output;

			if (operationType.indexOf("ERROR") === -1) {
				setInsights((prev) => {
					return prev.filter((row) => {
						const rowProjectId = resolveProjectId(row);
						const rowInsightId = resolveInsightId(row);
						return !(
							rowProjectId === insightToDelete.projectId &&
							rowInsightId === insightToDelete.insightId
						);
					});
				});
				toast.success(`Successfully deleted ${insightToDelete.name}`);
			} else {
				toast.error(String(output || "Failed to delete insight"));
			}
		} catch (error) {
			toast.error(String(error));
		} finally {
			setIsDeletingInsight(false);
			setInsightToDelete(null);
		}
	};

	return (
		<div className="flex w-full flex-col gap-6">
			{(getInsights.status === "LOADING" || isSearching) && (
				<div className="flex w-full items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					<span>
						{isSearching
							? "Searching insights..."
							: "Loading insights..."}
					</span>
				</div>
			)}

			<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
				<div className="relative w-full flex-1">
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
						}}
						placeholder="Insight"
						className="h-10 pl-9"
					/>
				</div>
				<div className="w-full sm:w-[220px]">
					<p className="mb-1 text-muted-foreground text-xs">
						Sort By
					</p>
					<div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-base sm:text-sm">
						Name
					</div>
				</div>
			</div>

			<div className="flex w-full flex-col gap-2">
				{insights.length === 0 && getInsights.status === "SUCCESS" ? (
					<div className="py-4 text-center text-muted-foreground text-sm">
						No insights found
					</div>
				) : null}

				{insights.map((insight) => {
					const insightId = resolveInsightId(insight);
					const projectId = resolveProjectId(insight);
					if (!insightId || !projectId) {
						return null;
					}

					const name = resolveInsightName(insight);
					const permission = resolveInsightPermission(insight);
					const canManage =
						adminMode || isOwnerPermission(permission);

					return (
						<div key={`${projectId}-${insightId}`}>
							<EngineLandscapeCard
								name={name}
								id={insightId}
								owner={"N/A"}
								description={insight.description || ""}
								date={insight.created_on}
								tag={insight.tags}
								type={"PROJECT"}
								customIcon={<SEMOSS width={20} height={23} />}
								desktopInlineMeta={true}
								isGlobal={isTruthyGlobal(
									insight.insight_global,
								)}
								hideFavorite={true}
								isDiscoverable={true}
								enableGlobalAction={canManage}
								global={() => {
									void setInsightGlobal(insight);
								}}
								onDelete={
									canManage
										? () => {
												setInsightToDelete({
													projectId,
													insightId,
													name,
												});
											}
										: undefined
								}
								onClick={() => {
									navigate(`${insightId}/${projectId}`, {
										state: {
											name,
											global: isTruthyGlobal(
												insight.insight_global,
											),
											permission,
										},
									});
								}}
							/>
						</div>
					);
				})}
			</div>

			<DeleteEntityDialog
				open={Boolean(insightToDelete)}
				onOpenChange={(open) => {
					if (!open) {
						setInsightToDelete(null);
					}
				}}
				entityType="Insight"
				entityName={insightToDelete?.name}
				entityId={insightToDelete?.insightId}
				onConfirm={deleteInsight}
				isLoading={isDeletingInsight}
			/>
		</div>
	);
};

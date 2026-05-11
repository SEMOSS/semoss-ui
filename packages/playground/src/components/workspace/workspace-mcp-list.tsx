import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Muted, ScrollArea, toast } from "@semoss/ui/next";
import type { ProjectDependency } from "@/types";
import { MCPCard } from "../mcp";

export interface WorkspaceMCPListProps {
	/**
	 * Type of mcp
	 */
	type: "TOOLBOX" | "KNOWLEDGE";

	/**
	 * WorkspaceId
	 */
	workspaceId: string;

	/**
	 * Search the mcps by name
	 */
	search: string;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceMCPList = ({
	type,
	workspaceId,
	search,
}: WorkspaceMCPListProps) => {
	const { t } = useTranslation("workspace");
	const { actions } = useInsight();

	const getDependencies = usePixel<{
		engines: ProjectDependency[];
		dependencies: string[]; // Top-level dependency IDs
	}>(
		workspaceId
			? `GetProjectDependencies(project=["${workspaceId}"]);`
			: "",
		{
			onError: (_d, e) => {
				toast.error(
					t("mcp.failedToLoad") +
						`: ${e instanceof Error ? e.message : "Unknown error"}`,
				);
			},
		},
	);

	const searchedMCP = useMemo(() => {
		// Filter engines to get only top-level dependencies
		const topLevelIds = getDependencies.data?.dependencies || [];
		const allEngines = getDependencies.data?.engines || [];
		const topLevelDeps = allEngines.filter((engine) =>
			topLevelIds.includes(engine.engine_id),
		);
		const dataWithType = topLevelDeps.filter((m) =>
			type === "TOOLBOX"
				? m.engine_type !== "VECTOR"
				: m.engine_type === "VECTOR",
		);
		if (!search) {
			return dataWithType;
		}
		return dataWithType.filter(
			(m) =>
				m.engine_id.toLowerCase().includes(search.toLowerCase()) ||
				m.engine_name.toLowerCase().includes(search.toLowerCase()),
		);
	}, [getDependencies.data, search, type]);

	if (searchedMCP.length === 0) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Muted>
					{type === "TOOLBOX"
						? t("mcp.noToolboxes")
						: t("mcp.noKnowledge")}
				</Muted>
			</div>
		);
	}

	const getEffectivePermission = (
		m: ProjectDependency,
	):
		| "READ_ONLY"
		| "REQUESTED"
		| "DISCOVERABLE"
		| "FULLY_PRIVATE"
		| "EDIT"
		| "OWNER" => {
		if (m.permission_name) {
			return m.permission_name;
		} else if (m.engine_global) {
			return "READ_ONLY";
		} else if (m.engine_discoverable) {
			if (typeof m.access_permission === "number") {
				return "REQUESTED";
			} else {
				return "DISCOVERABLE";
			}
		}
		return "FULLY_PRIVATE";
	};

	const handleRequestAccess = async (m: ProjectDependency) => {
		try {
			const response = await actions.run(
				m.engine_type === "PROJECT"
					? `RequestProject(project=${JSON.stringify(
							m.engine_id,
						)}, permission=${JSON.stringify("READ_ONLY")})`
					: `RequestEngine(engine=${JSON.stringify(m.engine_id)}, permission=${JSON.stringify("READ_ONLY")})`,
			);
			if (
				response.pixelReturn.some((r) =>
					r.operationType.some((op) => op === "ERROR"),
				)
			) {
				throw new Error("Failed to request access");
			}
			toast.success(t("mcp.requestedSuccess", { name: m.engine_name }));
			getDependencies.refresh();
		} catch {
			toast.error(t("mcp.requestedFailed"));
		}
	};

	return (
		<ScrollArea className="h-full w-full">
			<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
				{searchedMCP.map((m) => {
					const effectivePermission = getEffectivePermission(m);

					const missingSubDependencies =
						m.can_view_dependencies === false;
					return (
						<MCPCard
							key={m.engine_id}
							m={{
								id: m.engine_id,
								name: m.engine_name,
								type: m.engine_type,
								description: m.description,
								tags: m.tags?.split(",") || [],
							}}
							type={type}
							effectivePermission={effectivePermission}
							missingSubDependencies={missingSubDependencies}
							handleRequestAccess={() => handleRequestAccess(m)}
						/>
					);
				})}
			</div>
		</ScrollArea>
	);
};

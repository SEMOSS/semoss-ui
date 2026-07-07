import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel, usePixel } from "@semoss/sdk/react";
import {
	Button,
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	ScrollBar,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { App, MCP, SkillConfig } from "../../types";
import { MCPCard } from "../mcp/mcp-card";
import { engineProjectToMCP } from "../mcp/mcp-utils";

/**
 * Raw platform-skill row returned by `GetSkills(filter="platform")`. Platform
 * skills are read-only built-ins shipped with the platform: they are not
 * projects, so they have no id and are referenced by their folder `slug`.
 */
interface PlatformSkill {
	slug: string;
	name: string;
	description: string;
	origin: "PLATFORM";
}

interface SkillSelectorProps {
	/** Selected skills */
	values: SkillConfig[];

	/** Track if disabled */
	disabled?: boolean;

	/** Callback fired when the selected skills change */
	onChange: (values: SkillConfig[]) => void;

	/** Extra classes appended to the outer wrapper (e.g. for sizing) */
	className?: string;
}

/**
 * Renders the SkillSelector component for attaching skills to an agent.
 *
 * Two kinds of skills are listed: the user's own registry skills (SKILL
 * projects, attached by id) and read-only platform built-ins (attached by
 * slug). Platform skills are shown in their own "Platform" group with a badge.
 */
export const SkillSelector: React.FC<SkillSelectorProps> = ({
	values,
	disabled,
	onChange,
	className,
}) => {
	const { t } = useTranslation("mcp");
	const [search, setSearch] = useState<string>("");

	const debouncedSearch = useDebouncedValue(search, 500);

	// track the selected ones by id (platform skills key by slug)
	const selected = values.reduce(
		(acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		},
		{} as Record<string, SkillConfig>,
	);

	/**
	 * Get all of the registry skills with lazy loading
	 */
	const getSkills = useIteratorPixel<App[], App>(
		(limit, offset) =>
			`META | MyProjects(${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}type = "SKILL", limit=[${limit}], offset=[${offset}])`,
		(response) => (response.length < 25 ? -1 : Infinity),
		(response) => response,
		{ limit: 25 },
		[debouncedSearch],
	);

	/**
	 * Get the platform (built-in) skills. This is a small fixed set, so it is
	 * fetched in one shot and filtered client-side by the search box.
	 */
	const platformSkills = usePixel<PlatformSkill[]>(
		`GetSkills(filter="platform")`,
		{
			data: [],
		},
	);

	const filteredPlatformSkills = platformSkills.data.filter((s) => {
		if (!debouncedSearch) return true;
		const q = debouncedSearch.toLowerCase();
		return (
			s.name.toLowerCase().includes(q) ||
			(s.description ?? "").toLowerCase().includes(q)
		);
	});

	/**
	 * Setup infinite scroll for the registry skill list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getSkills.isLoading || !getSkills.hasMore,
		onNext: () => {
			getSkills.next();
		},
	});

	/**
	 * Toggle a skill selection
	 */
	const onSelect = (skill: SkillConfig) => {
		if (Object.hasOwn(selected, skill.id)) {
			onChange(values.filter((s) => s.id !== skill.id));
		} else {
			onChange([...values, skill]);
		}
	};

	/** Normalize a platform skill into the shared MCP card shape. */
	const platformSkillToMCP = (skill: PlatformSkill): MCP => ({
		type: "PROJECT",
		id: skill.slug,
		name: skill.name,
		description: skill.description ?? "",
		tags: [],
		permission: "READ_ONLY",
	});

	const platformLoading = platformSkills.status === "LOADING";
	const noResults =
		!getSkills.isLoading &&
		!platformLoading &&
		getSkills.data.length === 0 &&
		filteredPlatformSkills.length === 0;

	const isEmpty = noResults && values.length === 0;

	return (
		<div
			className={cn(
				"flex w-full flex-col overflow-hidden rounded-xl border-border bg-card shadow-sm",
				isEmpty ? "h-auto" : cn("h-full min-h-0", className),
			)}
		>
			<div className="flex w-full shrink-0 flex-row gap-2 border-border bg-muted p-4">
				<InputGroup className="bg-background">
					<InputGroupInput
						placeholder={t("selector.search")}
						value={search}
						disabled={disabled || getSkills.isLoading}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>
			</div>

			<ScrollArea
				className="min-h-0 w-full flex-1"
				viewportRef={(e) => setScroll(e)}
			>
				{/* Platform skills */}
				{filteredPlatformSkills.length > 0 && (
					<div>
						<div className="px-4 pt-4 pb-1 font-medium text-muted-foreground text-xs">
							{t("selector.builtInSection")}
						</div>
						<div className="grid grid-cols-1 gap-4 px-4 pt-2 pb-2 md:grid-cols-2 lg:grid-cols-3">
							{filteredPlatformSkills.map((skill) => {
								const mcp = platformSkillToMCP(skill);
								return (
									<MCPCard
										key={mcp.id}
										m={mcp}
										typeLabel="Skill"
										badge={t("selector.platformBadge")}
										selected={Object.hasOwn(
											selected,
											mcp.id,
										)}
										onClick={() =>
											onSelect({
												id: skill.slug,
												name: skill.name,
												type: "PLATFORM_SKILL",
											})
										}
									/>
								);
							})}
						</div>
					</div>
				)}

				{/* Registry skills */}
				{getSkills.isLoading && (
					<div className="flex h-64 w-full items-center justify-center">
						<Spinner />
					</div>
				)}
				{!getSkills.isLoading && getSkills.data.length !== 0 && (
					<div>
						<div className="px-4 pt-4 pb-1 font-medium text-muted-foreground text-xs">
							{t("selector.registrySection")}
						</div>
						<div className="grid grid-cols-1 gap-4 px-4 pt-2 pb-4 md:grid-cols-2 lg:grid-cols-3">
							{getSkills.data.map((skill) => {
								const mcp = engineProjectToMCP(skill);
								return (
									<MCPCard
										key={mcp.id}
										m={mcp}
										typeLabel="Skill"
										selected={Object.hasOwn(
											selected,
											mcp.id,
										)}
										effectivePermission={mcp.permission}
										onClick={() =>
											onSelect({
												id: mcp.id,
												name: mcp.name,
												type: "SKILL",
											})
										}
									/>
								);
							})}
						</div>
					</div>
				)}

				{/* Nothing to show */}
				{noResults && (
					<div className="flex h-24 w-full items-center justify-center">
						<Muted>{t("selector.noSkillsFound")}</Muted>
					</div>
				)}
			</ScrollArea>
			{values.length > 0 && (
				<ScrollArea className="w-full shrink-0 whitespace-nowrap">
					<ScrollBar orientation="horizontal" />
					<div className="flex space-x-2 p-4">
						{values.map((skill) => (
							<div
								key={skill.id}
								className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-card-foreground text-xs"
								title={skill.name}
							>
								<span className="max-w-40 truncate">
									{skill.name}
								</span>
								<Button
									className="-me-0.5"
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled={disabled}
									onClick={() => onSelect(skill)}
								>
									<XIcon />
								</Button>
							</div>
						))}
					</div>
				</ScrollArea>
			)}
		</div>
	);
};

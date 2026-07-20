import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
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
import type { App, SkillConfig } from "../../types";
import { MCPCard } from "../mcp/mcp-card";
import { engineProjectToMCP } from "../mcp/mcp-utils";

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

	// track the selected ones by id
	const selected = values.reduce(
		(acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		},
		{} as Record<string, SkillConfig>,
	);

	/**
	 * Get all of the skills with lazy loading
	 */
	const getSkills = useIteratorPixel<App[], App>(
		(limit, offset) =>
			`META | MyProjects(${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}projectType=["SKILL"], limit=[${limit}], offset=[${offset}])`,
		(response) => (response.length < 25 ? -1 : Infinity),
		(response) => response,
		{ limit: 25 },
		[debouncedSearch],
	);

	/**
	 * Setup infinite scroll for the skill list
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

	const isEmpty =
		!getSkills.isLoading &&
		getSkills.data.length === 0 &&
		values.length === 0;

	return (
		<div
			className={cn(
				"flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
				isEmpty ? "h-auto" : cn("h-full min-h-0", className),
			)}
		>
			<div className="flex w-full shrink-0 flex-row gap-2 border-border border-b bg-muted p-4">
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
				{getSkills.isLoading && (
					<div className="flex h-64 w-full items-center justify-center">
						<Spinner />
					</div>
				)}
				{!getSkills.isLoading && getSkills.data.length === 0 && (
					<div className="flex h-24 w-full items-center justify-center">
						<Muted>{t("selector.noSkillsFound")}</Muted>
					</div>
				)}
				{!getSkills.isLoading && getSkills.data.length !== 0 && (
					<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
						{getSkills.data.map((skill) => {
							const mcp = engineProjectToMCP(skill);
							return (
								<MCPCard
									key={mcp.id}
									m={mcp}
									typeLabel="Skill"
									selected={Object.hasOwn(selected, mcp.id)}
									effectivePermission={mcp.permission}
									onClick={() =>
										onSelect({ id: mcp.id, name: mcp.name })
									}
								/>
							);
						})}
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

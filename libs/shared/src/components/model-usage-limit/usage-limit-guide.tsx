import {
	ArrowRight,
	Building2,
	CalendarClock,
	Check,
	CircleDashed,
	CircleSlash,
	Eye,
	Gauge,
	Globe,
	InfinityIcon,
	KeyRound,
	Layers,
	ListChecks,
	ListOrdered,
	type LucideIcon,
	MapPin,
	Ruler,
	Scale,
	ShieldCheck,
	SlidersHorizontal,
	User,
	UserCheck,
	Users,
	UsersRound,
	Wrench,
} from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Alert,
	AlertDescription,
	Badge,
	cn,
} from "@semoss/ui/next";
import type { ModelUsageLimitSource } from "./model-usage-limit-format";
import {
	CEILINGS_INTRO,
	LIMIT_APPLIED_BY_INTRO,
	ORDER_INTRO,
	ORDER_NONE_DEFINED,
	USAGE_LIMIT_CAN_SET_LABEL,
	USAGE_LIMIT_CEILINGS,
	USAGE_LIMIT_GUIDE_SECTION_SUMMARIES,
	USAGE_LIMIT_GUIDE_SECTION_TITLES,
	USAGE_LIMIT_GUIDE_SECTIONS,
	USAGE_LIMIT_MODES,
	USAGE_LIMIT_ORDER,
	USAGE_LIMIT_RULE_TERMS,
	USAGE_LIMIT_SEE_FOR_MANAGERS,
	USAGE_LIMIT_SEE_FOR_SELF,
	USAGE_LIMIT_SETTER_LABELS,
	USAGE_LIMIT_SETUPS,
	USAGE_LIMIT_TEAM_RULES,
	USAGE_LIMIT_VIEWER_NOTES,
	USAGE_LIMIT_WHO_RULES,
	type UsageLimitGuideEntry,
	type UsageLimitGuideSection,
	type UsageLimitGuideSource,
} from "./usage-limit-guide-content";

/** Each section's icon, beside its title */
const SECTION_ICONS: Readonly<Record<UsageLimitGuideSection, LucideIcon>> = {
	order: ListOrdered,
	modes: SlidersHorizontal,
	rules: Scale,
	teams: Users,
	who: KeyRound,
	setups: Wrench,
	see: Eye,
};

/** Each limit's icon, beside its name */
const SOURCE_ICONS: Readonly<Record<ModelUsageLimitSource, LucideIcon>> = {
	MODEL_TOTAL: Gauge,
	TEAM_TOTAL: UsersRound,
	DIRECT: User,
	TEAM: Users,
	PUBLIC: Globe,
	ALL_MODELS: Layers,
	PLATFORM: Building2,
};

/** The icons of No Limit Defined, Unlimited and Rules, in the order of USAGE_LIMIT_MODES */
const MODE_ICONS: readonly LucideIcon[] = [
	CircleDashed,
	InfinityIcon,
	ListChecks,
];

/** The icons of what rules count, in the order of USAGE_LIMIT_RULE_TERMS */
const RULE_TERM_ICONS: readonly LucideIcon[] = [
	Ruler,
	CalendarClock,
	Users,
	ShieldCheck,
];

/** An icon in a tinted square, beside a title */
const ICON_TILE_CLASS =
	"flex shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary";

/** A framed group inside a section */
const GROUP_CLASS = "rounded-lg border border-border";

/** The header of a framed group */
const GROUP_HEADER_CLASS =
	"flex items-start gap-2 border-border border-b bg-muted/40 px-3 py-2";

/** A small line with an icon, under a limit */
const DETAIL_CLASS = "flex items-start gap-1.5 text-muted-foreground text-xs";

/** What the viewer of the guide can set, to mark those limits */
export interface UsageLimitGuideViewer {
	/** Whether the viewer can set this model's limits: one of its owners, or an admin in admin mode */
	canSetModelLimits?: boolean;
	/** Whether the viewer is an admin in admin mode, who also sets the limits across all models */
	isAdminMode?: boolean;
}

/** Props for {@link UsageLimitGuide}. */
export interface UsageLimitGuideProps {
	/** The section to open, along with How a Limit Is Picked */
	section?: UsageLimitGuideSection;
	/** What the viewer can set, to mark the limits they can; left out, nothing is marked */
	viewer?: UsageLimitGuideViewer;
	/** Whether the reader is looking at their own limits, which leaves out the common setups */
	isOwnView?: boolean;
	/** Classes for the guide */
	className?: string;
}

/**
 * @param source - a limit as the guide explains it
 * @param viewer - what the viewer can set
 * @returns whether the viewer can set that limit
 */
const canViewerSet = (
	source: UsageLimitGuideSource,
	viewer: UsageLimitGuideViewer,
): boolean =>
	viewer.isAdminMode === true ||
	(source.setBy === "OWNERS" && viewer.canSetModelLimits === true);

/**
 * @param viewer - what the viewer can set
 * @returns a sentence saying so
 */
const getViewerNote = (viewer: UsageLimitGuideViewer): string =>
	viewer.isAdminMode
		? USAGE_LIMIT_VIEWER_NOTES.admin
		: viewer.canSetModelLimits
			? USAGE_LIMIT_VIEWER_NOTES.owner
			: USAGE_LIMIT_VIEWER_NOTES.editor;

/**
 * @param value - a section
 * @returns its trigger: its icon, title and summary
 */
const renderTrigger = (value: UsageLimitGuideSection) => {
	const Icon = SECTION_ICONS[value];
	return (
		<span className="flex items-start gap-3">
			<span className={cn(ICON_TILE_CLASS, "size-8")}>
				<Icon className="size-4" aria-hidden />
			</span>
			<span className="flex flex-col gap-0.5">
				<span>{USAGE_LIMIT_GUIDE_SECTION_TITLES[value]}</span>
				<span className="font-normal text-muted-foreground text-xs">
					{USAGE_LIMIT_GUIDE_SECTION_SUMMARIES[value]}
				</span>
			</span>
		</span>
	);
};

/**
 * @param source - a limit as the guide explains it
 * @param viewer - what the viewer can set, or undefined to mark nothing
 * @returns its name, who sets it, what it covers, where it is set and when it
 *          is skipped
 */
const renderSource = (
	source: UsageLimitGuideSource,
	viewer?: UsageLimitGuideViewer,
) => {
	const Icon = SOURCE_ICONS[source.source];
	return (
		<div className="flex flex-col gap-1">
			<div className="flex flex-wrap items-center gap-2">
				<Icon className="size-4 shrink-0 text-primary" aria-hidden />
				<span className="font-medium">{source.label}</span>
				<Badge variant="outline" className="font-normal">
					{USAGE_LIMIT_SETTER_LABELS[source.setBy]}
				</Badge>
				{viewer && canViewerSet(source, viewer) ? (
					<Badge>
						<Check aria-hidden />
						{USAGE_LIMIT_CAN_SET_LABEL}
					</Badge>
				) : null}
			</div>
			<p>{source.covers}</p>
			<p className={DETAIL_CLASS}>
				<MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
				{source.setIn}
			</p>
			{source.skipped ? (
				<p className={DETAIL_CLASS}>
					<CircleSlash
						className="mt-0.5 size-3.5 shrink-0"
						aria-hidden
					/>
					{source.skipped}
				</p>
			) : null}
		</div>
	);
};

/**
 * @param Icon - the group's icon
 * @param title - the group's title
 * @param intro - what the group is
 * @returns the header of a framed group
 */
const renderGroupHeader = (Icon: LucideIcon, title: string, intro: string) => (
	<div className={GROUP_HEADER_CLASS}>
		<Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
		<div className="flex flex-col gap-0.5">
			<p className="font-medium">{title}</p>
			<p className="text-muted-foreground text-xs">{intro}</p>
		</div>
	</div>
);

/**
 * @param viewer - what the viewer can set, or undefined to mark nothing
 * @returns How a Limit Is Picked: the ceilings, then the limits in the order
 *          they are tried, numbered as steps
 */
const renderOrder = (viewer?: UsageLimitGuideViewer) => (
	<div className="flex flex-col gap-4">
		<p>{ORDER_INTRO}</p>
		<section className={GROUP_CLASS}>
			{renderGroupHeader(ShieldCheck, "Ceilings", CEILINGS_INTRO)}
			<ul className="divide-y divide-border">
				{USAGE_LIMIT_CEILINGS.map((source) => (
					<li key={source.source} className="px-3 py-3">
						{renderSource(source, viewer)}
					</li>
				))}
			</ul>
		</section>
		<section className={GROUP_CLASS}>
			{renderGroupHeader(
				ListOrdered,
				"Limit Applied By",
				LIMIT_APPLIED_BY_INTRO,
			)}
			<ol className="flex flex-col px-3 py-3">
				{USAGE_LIMIT_ORDER.map((source, index) => (
					<li
						key={source.source}
						className="relative flex gap-3 pb-4 last:pb-0"
					>
						{index < USAGE_LIMIT_ORDER.length - 1 ? (
							// the line down to the next step
							<span
								aria-hidden
								className="absolute start-3 top-7 bottom-0 border-border border-s"
							/>
						) : null}
						<span
							aria-hidden
							className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs"
						>
							{index + 1}
						</span>
						<div className="min-w-0 flex-1">
							{renderSource(source, viewer)}
						</div>
					</li>
				))}
			</ol>
			<p className="border-border border-t px-3 py-2 text-muted-foreground text-xs">
				{ORDER_NONE_DEFINED}
			</p>
		</section>
	</div>
);

/**
 * @param entries - terms and what each means
 * @param icons - each term's icon, in the same order
 * @returns them as framed rows, each with its icon
 */
const renderEntries = (
	entries: readonly UsageLimitGuideEntry[],
	icons: readonly LucideIcon[],
) => (
	<dl className="flex flex-col gap-3">
		{entries.map((entry, index) => {
			const Icon = icons[index];
			return (
				<div key={entry.term} className={cn(GROUP_CLASS, "p-3")}>
					<dt className="flex items-center gap-2 font-medium">
						{Icon ? (
							<span className={cn(ICON_TILE_CLASS, "size-7")}>
								<Icon className="size-4" aria-hidden />
							</span>
						) : null}
						{entry.term}
					</dt>
					<dd className="mt-2 text-muted-foreground">{entry.text}</dd>
				</div>
			);
		})}
	</dl>
);

/**
 * @param points - a section's points, in order
 * @returns them as a list with a dot before each
 */
const renderPoints = (points: readonly string[]) => (
	<ul className="flex flex-col gap-2">
		{points.map((point) => (
			<li key={point} className="flex gap-2">
				<span
					aria-hidden
					className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
				/>
				<span>{point}</span>
			</li>
		))}
	</ul>
);

/**
 * @returns Common Setups: each goal, and the limits that reach it
 */
const renderSetups = () => (
	<ul className={cn(GROUP_CLASS, "divide-y divide-border")}>
		{USAGE_LIMIT_SETUPS.map((entry) => (
			<li key={entry.term} className="flex flex-col gap-1 px-3 py-2.5">
				<span className="font-medium">{entry.term}</span>
				<span className="flex items-start gap-1.5 text-muted-foreground">
					<ArrowRight
						className="mt-0.5 size-4 shrink-0 text-primary"
						aria-hidden
					/>
					{entry.text}
				</span>
			</li>
		))}
	</ul>
);

/**
 * How Usage Limits Work: the rules every usage limit follows, the same
 * wherever limits are set or shown. Each section opens on its own, with its
 * icon and a summary; How a Limit Is Picked and the host's section start open.
 * Given what the viewer can set, it marks the limits they can.
 */
export const UsageLimitGuide = ({
	section,
	viewer,
	isOwnView = false,
	className,
}: UsageLimitGuideProps) => {
	const sections = USAGE_LIMIT_GUIDE_SECTIONS.filter(
		(value) => !(isOwnView && value === "setups"),
	);
	const opened: UsageLimitGuideSection[] =
		section && section !== "order" && sections.includes(section)
			? ["order", section]
			: ["order"];

	const contentOf = (value: UsageLimitGuideSection) => {
		switch (value) {
			case "order":
				return renderOrder(viewer);
			case "modes":
				return renderEntries(USAGE_LIMIT_MODES, MODE_ICONS);
			case "rules":
				return renderEntries(USAGE_LIMIT_RULE_TERMS, RULE_TERM_ICONS);
			case "teams":
				return renderPoints(USAGE_LIMIT_TEAM_RULES);
			case "who":
				return (
					<div className="flex flex-col gap-3">
						{viewer ? (
							<Alert className="border-primary/30 bg-primary/5">
								<UserCheck aria-hidden />
								<AlertDescription className="text-foreground">
									{getViewerNote(viewer)}
								</AlertDescription>
							</Alert>
						) : null}
						{renderPoints(USAGE_LIMIT_WHO_RULES)}
					</div>
				);
			case "setups":
				return renderSetups();
			case "see":
				return (
					<p>
						{isOwnView
							? USAGE_LIMIT_SEE_FOR_SELF
							: USAGE_LIMIT_SEE_FOR_MANAGERS}
					</p>
				);
		}
	};

	return (
		<Accordion
			type="multiple"
			defaultValue={opened}
			className={cn("max-w-prose", className)}
		>
			{sections.map((value, index) => (
				<AccordionItem key={value} value={value}>
					{/* the first section sits close under the host's header */}
					<AccordionTrigger
						className={cn("items-center", index === 0 && "pt-2")}
					>
						{renderTrigger(value)}
					</AccordionTrigger>
					<AccordionContent>{contentOf(value)}</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
};

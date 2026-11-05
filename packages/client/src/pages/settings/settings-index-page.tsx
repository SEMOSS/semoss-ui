import {
	Bot,
	Briefcase,
	ChartBar,
	CircleUserRound,
	DatabaseZap,
	FileText,
	FolderOpen,
	Github,
	KeyRound,
	Landmark,
	Link2,
	Palette,
	ScrollText,
	SearchIcon,
	Settings,
	ShieldUser,
	Users2,
	X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import {
	Card,
	CardContent,
	cn,
	H2,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	P,
} from "@semoss/ui/next";
import { formatToDataTestId } from "@semoss/utility/text";
import { useSettings } from "@/hooks/useSettings";
import { SETTINGS_GROUPS, SETTINGS_ROUTES } from "./settings.constants";

const DEFAULT_CARDS = SETTINGS_ROUTES.filter(
	(r) => !!r.path && (r.history?.length ?? 0) < 2 && !r.hidden,
);

const ICON_CLASS = "size-4";

type CardConfig = { icon: ReactNode; className: string; label?: string };

const CardMapper: Record<string, CardConfig> = {
	"My Profile": {
		icon: <CircleUserRound className={ICON_CLASS} />,
		className: "bg-chart-3/10 text-chart-3",
	},
	"My Files": {
		icon: <FolderOpen className={ICON_CLASS} />,
		className: "bg-chart-4/10 text-chart-4",
	},
	"Resource Governance": {
		icon: <Landmark className={ICON_CLASS} />,
		className: "bg-chart-2/10 text-chart-2",
	},
	"Member Settings": {
		icon: <Users2 className={ICON_CLASS} />,
		className: "bg-chart-4/10 text-chart-4",
	},
	Configuration: {
		icon: <Settings className={ICON_CLASS} />,
		className: "bg-chart-5/10 text-chart-5",
	},
	"GitHub App": {
		icon: <Github className={ICON_CLASS} />,
		className: "bg-muted text-muted-foreground",
	},
	"Enterprise Usage & Activity": {
		icon: <ChartBar className={ICON_CLASS} aria-hidden="true" />,
		className: "bg-primary/10 text-primary",
	},
	"Audit Trail": {
		icon: <ScrollText className={ICON_CLASS} />,
		className: "bg-primary/10 text-primary",
	},
	"Agent Runs": {
		icon: <Bot className={ICON_CLASS} />,
		className: "bg-chart-4/10 text-chart-4",
	},
	"Admin Query": {
		icon: <DatabaseZap className={ICON_CLASS} />,
		className: "bg-chart-2/10 text-chart-2",
	},
	"Admin Theme": {
		icon: <Palette className={ICON_CLASS} />,
		className: "bg-chart-3/10 text-chart-3",
	},
	"External Connections": {
		icon: <Link2 className={ICON_CLASS} />,
		className: "bg-muted text-muted-foreground",
	},
	Teams: {
		icon: <Users2 className={ICON_CLASS} />,
		className: "bg-chart-3/10 text-chart-3",
	},
	"Teams Management": {
		icon: <Users2 className={ICON_CLASS} />,
		className: "bg-chart-3/10 text-chart-3",
	},
	"Team Permissions": {
		icon: <ShieldUser className={ICON_CLASS} />,
		className: "bg-chart-3/10 text-chart-3",
	},
	"My Teams": {
		icon: <Users2 className={ICON_CLASS} />,
		className: "bg-chart-3/10 text-chart-3",
	},
	"Service Accounts": {
		icon: <KeyRound className={ICON_CLASS} />,
		className: "bg-muted text-muted-foreground",
	},
	Jobs: {
		icon: <Briefcase className={ICON_CLASS} />,
		className: "bg-primary/10 text-primary",
	},
	"View RDF Map": {
		icon: <FileText className={ICON_CLASS} />,
		className: "bg-chart-3/10 text-chart-3",
	},
	"LLM Feedback": {
		icon: <ChartBar className={ICON_CLASS} />,
		className: "bg-primary/10 text-primary",
	},
};

export const SettingsIndexPage = () => {
	const { adminMode } = useSettings();
	const headingId = useId();
	const [search, setSearch] = useState<string>("");

	// each heading keeps the tiles' route order, and one with no tiles is left out
	const groups = useMemo(() => {
		const cleanedSearch = search.trim().toLowerCase();
		const visibleCards = DEFAULT_CARDS.filter(
			(c) =>
				(!c.admin || adminMode) &&
				c.title.toLowerCase().includes(cleanedSearch),
		);

		return SETTINGS_GROUPS.map((group) => ({
			...group,
			cards: visibleCards.filter((c) => c.group === group.value),
		})).filter((group) => group.cards.length > 0);
	}, [adminMode, search]);

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex w-full min-w-0 flex-wrap items-end gap-2 md:flex-nowrap">
				<InputGroup className="flex-1">
					<InputGroupAddon>
						<SearchIcon
							className="size-4 text-muted-foreground"
							aria-hidden="true"
						/>
					</InputGroupAddon>
					<InputGroupInput
						placeholder={"Search"}
						aria-label="Search settings"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						data-testid={"settingsIndexPage-searchBar"}
					/>
					{search && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								variant="ghost"
								onClick={() => setSearch("")}
								aria-label="Clear search"
							>
								<X className="size-4" aria-hidden="true" />
							</InputGroupButton>
						</InputGroupAddon>
					)}
				</InputGroup>
			</div>

			{groups.length === 0 ? (
				<P className="text-muted-foreground text-sm">
					No settings match {search.trim()}
				</P>
			) : null}
			{groups.map((group) => (
				<section
					key={group.value}
					aria-labelledby={`${headingId}-${group.value}`}
					className="flex flex-col gap-3"
				>
					<H2
						id={`${headingId}-${group.value}`}
						className="font-medium text-muted-foreground text-sm"
					>
						{group.label}
					</H2>
					<div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
						{group.cards.map((card) => (
							<Link
								key={card.path}
								to={`/settings/${card.path}`}
								data-testid={formatToDataTestId(
									`settingsIndexPage-${card.title}-card`,
								)}
								className="min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
							>
								<Card className="h-full w-full gap-4 py-4 hover:bg-accent/50">
									<CardContent>
										<div className="flex flex-col items-start gap-3">
											<div className="flex items-center gap-2">
												{CardMapper[card.title] ? (
													<div
														aria-hidden="true"
														className={cn(
															"flex size-8 shrink-0 items-center justify-center rounded-md p-1",
															CardMapper[
																card.title
															].className,
														)}
													>
														{
															CardMapper[
																card.title
															].icon
														}
													</div>
												) : null}
												<span>
													{CardMapper[card.title]
														?.label ?? card.title}
												</span>
											</div>
											<P className="text-muted-foreground text-sm leading-5">
												{card.description}
											</P>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</section>
			))}
		</div>
	);
};

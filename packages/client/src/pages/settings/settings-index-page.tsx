import {
	Archive,
	Bolt,
	Bot,
	Briefcase,
	ChartBar,
	CircleUserRound,
	Database,
	DatabaseZap,
	FileText,
	Github,
	KeyRound,
	LayoutGrid,
	Link2,
	Palette,
	Search,
	Settings,
	ShieldCheck,
	ShieldUser,
	Sigma,
	Users2,
} from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
	Card,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useSettings } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { formatToDataTestId } from "@/utility";
import { SETTINGS_ROUTES } from "./settings.constants";

const DEFAULT_CARDS = SETTINGS_ROUTES.filter(
	(r) => !!r.path && (r.history?.length ?? 0) < 2 && !r.hidden,
);

const ICON_CLASS = "size-4";

type CardConfig = { icon: ReactNode; color: string; label?: string };

const CardMapper: Record<string, CardConfig> = {
	"Database Settings": {
		icon: <Database className={ICON_CLASS} />,
		color: "#00A593",
	},
	"Model Settings": {
		icon: <Bot className={ICON_CLASS} />,
		color: "#0471F0",
	},
	"Storage Settings": {
		icon: <Archive className={ICON_CLASS} />,
		color: "#008674",
	},
	"App, Agent, & Skill Settings": {
		icon: <LayoutGrid className={ICON_CLASS} />,
		color: "#8340DE",
		label: "App, Agent, & Skill Settings",
	},
	"Vector Settings": {
		icon: <Bolt className={ICON_CLASS} />,
		color: "#A855F7",
	},
	"Function Settings": {
		icon: <Sigma className={ICON_CLASS} />,
		color: "#EC4899",
	},
	"Guardrail Settings": {
		icon: <ShieldCheck className={ICON_CLASS} />,
		color: "#0471F0",
	},
	"Insight Settings": {
		icon: <FileText className={ICON_CLASS} />,
		color: "#0094FF",
	},
	"Member Settings": {
		icon: <Users2 className={ICON_CLASS} />,
		color: "#FFB400",
	},
	Configuration: {
		icon: <Settings className={ICON_CLASS} />,
		color: "#ED2F77",
	},
	"GitHub App": {
		icon: <Github className={ICON_CLASS} />,
		color: "#111827",
	},
	"Admin Query": {
		icon: <DatabaseZap className={ICON_CLASS} />,
		color: "#558B2F",
	},
	"Admin Theme": {
		icon: <Palette className={ICON_CLASS} />,
		color: "#8C9EFF",
	},
	"External Connections": {
		icon: <Link2 className={ICON_CLASS} />,
		color: "#6B7280",
	},
	Teams: {
		icon: <Users2 className={ICON_CLASS} />,
		color: "#8364B8",
	},
	"Teams Management": {
		icon: <Users2 className={ICON_CLASS} />,
		color: "#8364B8",
	},
	"Team Permissions": {
		icon: <ShieldUser className={ICON_CLASS} />,
		color: "#8364B8",
	},
	"Service Accounts": {
		icon: <KeyRound className={ICON_CLASS} />,
		color: "#6B7280",
	},
	"My Profile": {
		icon: <CircleUserRound className={ICON_CLASS} />,
		color: "#471F96",
	},
	Jobs: {
		icon: <Briefcase className={ICON_CLASS} />,
		color: "#3B82F6",
	},
	"View RDF Map": {
		icon: <FileText className={ICON_CLASS} />,
		color: "#8340DE",
	},
	"LLM Feedback": {
		icon: <ChartBar className={ICON_CLASS} />,
		color: "#0471F0",
	},
};

export const SettingsIndexPage = () => {
	const navigate = useNavigate();
	const { adminMode } = useSettings();
	const [search, setSearch] = useState<string>("");

	const openSettingsRouteInNewTab = (path: string) => {
		const normalizedPath = path.startsWith("/")
			? path
			: `/settings/${path}`;
		window.open(`#${normalizedPath}`, "_blank", "noopener,noreferrer");
	};

	const handleCardClick = (event: MouseEvent, path: string) => {
		if (event.ctrlKey || event.metaKey || event.button === 1) {
			event.preventDefault();
			event.stopPropagation();
			openSettingsRouteInNewTab(path);
			return;
		}

		navigate(path);
	};

	const handleCardAuxClick = (event: MouseEvent, path: string) => {
		if (event.button !== 1) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		openSettingsRouteInNewTab(path);
	};

	const cards = useMemo(() => {
		const cleanedSearch = search.trim().toLowerCase();

		const visibleCards = DEFAULT_CARDS.filter((c) => {
			return !c.admin || adminMode;
		});

		// Keep existing route order stable while always placing admin-only
		// items after non-admin items.
		const nonAdminCards = visibleCards.filter((c) => !c.admin);
		const adminCards = visibleCards.filter((c) => c.admin);
		const orderedCards = [...nonAdminCards, ...adminCards];

		if (!cleanedSearch) {
			return orderedCards;
		}

		return orderedCards.filter((c) => {
			return c.title.toLowerCase().includes(cleanedSearch);
		});
	}, [adminMode, search]);

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
				<div className="relative w-full flex-1">
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
						}}
						placeholder="Search"
						data-testid={"settingsIndexPage-searchBar"}
						className="h-11 pl-9"
					/>
				</div>
				<div className="w-full sm:w-[180px]">
					<p className="mb-1 text-muted-foreground text-xs">Sort</p>
					<Select value={"DEFAULT"} onValueChange={() => {}}>
						<SelectTrigger
							data-testid={"settingsIndexPage-sort-select"}
						>
							<SelectValue placeholder="Sort" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="DEFAULT">Default</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
				{cards.map((c, i) => {
					return (
						<Card
							key={`settingsIndexPage-${c.title}-${c.path}-${i}-card`}
							onClick={(event) => handleCardClick(event, c.path)}
							onAuxClick={(event) =>
								handleCardAuxClick(event, c.path)
							}
							data-semoss-nav-click="true"
							data-testid={formatToDataTestId(
								`settingsIndexPage-${c.title}-card`,
							)}
							className="w-full cursor-pointer rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
						>
							<div className="flex flex-col gap-2 px-3.5">
								<div className="flex items-center gap-2">
									{CardMapper[c.title] ? (
										<div
											className="flex shrink-0 items-center justify-center rounded-md p-1.5 [&_svg]:size-4"
											style={{
												backgroundColor: `${CardMapper[c.title].color}1a`,
												color: CardMapper[c.title]
													.color,
											}}
										>
											{CardMapper[c.title].icon}
										</div>
									) : null}
									<span className="line-clamp-2 font-semibold text-sm leading-tight tracking-tight">
										{CardMapper[c.title]?.label ?? c.title}
									</span>
								</div>
								<p className="line-clamp-2 text-foreground text-xs leading-snug">
									{c.description}
								</p>
							</div>
						</Card>
					);
				})}
			</div>
		</div>
	);
};

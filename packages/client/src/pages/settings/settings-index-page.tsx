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
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useSettings } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import { SETTINGS_ROUTES } from "./settings.constants";

const DEFAULT_CARDS = SETTINGS_ROUTES.filter(
	(r) => !!r.path && r.history.length < 2 && !r.hidden,
);

const SIDEBAR_ICON_CLASS = "size-4";

const IconMapper: Record<string, ReactNode> = {
	"Database Settings": <Database className={SIDEBAR_ICON_CLASS} />,
	"Model Settings": <Bot className={SIDEBAR_ICON_CLASS} />,
	"Storage Settings": <Archive className={SIDEBAR_ICON_CLASS} />,
	"App Settings": <LayoutGrid className={SIDEBAR_ICON_CLASS} />,
	"Vector Settings": <Bolt className={SIDEBAR_ICON_CLASS} />,
	"Function Settings": <Sigma className={SIDEBAR_ICON_CLASS} />,
	"Guardrail Settings": <ShieldCheck className={SIDEBAR_ICON_CLASS} />,
	"Insight Settings": <FileText className={SIDEBAR_ICON_CLASS} />,
	"Member Settings": <Users2 className={SIDEBAR_ICON_CLASS} />,
	Configuration: <Settings className={SIDEBAR_ICON_CLASS} />,
	"Admin Query": <DatabaseZap className={SIDEBAR_ICON_CLASS} />,
	"Admin Theme": <Palette className={SIDEBAR_ICON_CLASS} />,
	"External Connections": <Link2 className={SIDEBAR_ICON_CLASS} />,
	Teams: <Users2 className={SIDEBAR_ICON_CLASS} />,
	"Teams Management": <Users2 className={SIDEBAR_ICON_CLASS} />,
	"Team Permissions": <ShieldUser className={SIDEBAR_ICON_CLASS} />,
	"My Profile": <CircleUserRound className={SIDEBAR_ICON_CLASS} />,
	Jobs: <Briefcase className={SIDEBAR_ICON_CLASS} />,
	"View RDF Map": <FileText className={SIDEBAR_ICON_CLASS} />,
	"LLM Feedback": <ChartBar className={SIDEBAR_ICON_CLASS} />,
};

export const SettingsIndexPage = () => {
	const navigate = useNavigate();
	const { adminMode } = useSettings();
	const [search, setSearch] = useState<string>("");

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
							onClick={() => {
								navigate(c.path);
							}}
							data-testid={formatToDataTestId(
								`settingsIndexPage-${c.title}-card`,
							)}
							className="flex h-full min-h-[112px] w-full cursor-pointer flex-col rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
						>
							<CardHeader className="-mt-1 flex flex-row items-center gap-2 space-y-0 px-3.5 pt-0 pb-0">
								<div className="flex w-7 min-w-0 shrink-0 items-center text-muted-foreground [&_svg]:size-4">
									{IconMapper[c.title]}
								</div>
								<CardTitle className="line-clamp-2 text-sm leading-tight">
									{c.title}
								</CardTitle>
							</CardHeader>
							<CardContent className="px-3.5 pt-0 pb-2">
								<p className="line-clamp-2 text-foreground text-xs leading-snug">
									{c.description}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
};

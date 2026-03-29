import { EllipsisVertical, Search, Users2 } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { AdminPanel } from "@/assets/img/AdminPanel";
import { ArchiveBox } from "@/assets/img/ArchiveBox";
import { Construction } from "@/assets/img/Construction";
import { DatabaseLayers } from "@/assets/img/DatabaseLayers";
import { Folder } from "@/assets/img/Folder";
import { Function as FunctionImg } from "@/assets/img/Function";
import { Group } from "@/assets/img/Group";
import { GroupRounded } from "@/assets/img/GroupRounded";
import { GuardrailIcon } from "@/assets/img/Guardrail";
import { Jobs } from "@/assets/img/Jobs";
import { Link } from "@/assets/img/Link";
import { ModelBrain } from "@/assets/img/ModelBrain";
import { PaintRounded } from "@/assets/img/PaintRounded";
import { PersonRounded } from "@/assets/img/PersonRounded";
import { SEMOSS } from "@/assets/img/SEMOSS";
import { Vector } from "@/assets/img/Vector";
import { useSettings } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import { SETTINGS_ROUTES } from "./settings.constants";

const DEFAULT_CARDS = SETTINGS_ROUTES.filter(
	(r) => !!r.path && r.history.length < 2 && !r.hidden,
);

const IconMapper: Record<string, ReactNode> = {
	"Database Settings": <DatabaseLayers />,
	"Model Settings": (
		<ModelBrain color={"#0471F0"} width={"50"} height={"50"} />
	),
	"Storage Settings": <ArchiveBox />,
	"App Settings": <Folder />,
	"Vector Settings": <Vector />,
	"Function Settings": <FunctionImg />,
	"Insight Settings": <SEMOSS />,
	"Member Settings": <Group />,
	Configuration: <Construction />,
	"Admin Query": <AdminPanel />,
	"Admin Theme": <PaintRounded />,
	"External Connections": <Link />,
	Teams: <GroupRounded />,
	"Teams Management": <GroupRounded />,
	"Team Permissions": <Users2 />,
	"My Profile": <PersonRounded />,
	Jobs: <Jobs />,
	"View RDF Map": <Folder />,
	"Guardrail Settings": <GuardrailIcon />,
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

			<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
							className="flex h-full min-h-[180px] w-full cursor-pointer flex-col justify-between rounded-3xl border bg-card shadow-sm transition-shadow hover:shadow-md"
						>
							<CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
								<div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted/40 [&_svg]:h-9 [&_svg]:w-9">
									{IconMapper[c.title]}
								</div>
								<CardTitle className="line-clamp-2 leading-tight">
									{c.title}
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-2">
								<p className="line-clamp-2 text-base text-foreground">
									{c.description}
								</p>
							</CardContent>
							<CardFooter className="justify-end pt-0">
								<Button
									variant="ghost"
									size="icon-sm"
									disabled={true}
									data-testid={
										"settingsIndexPage-setting-btn"
									}
									onClick={(e) => {
										e.stopPropagation();
									}}
								>
									<EllipsisVertical className="size-4 text-muted-foreground" />
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>
		</div>
	);
};

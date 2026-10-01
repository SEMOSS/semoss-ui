import { Search, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppCatalogAvatar } from "@semoss/shared/app-catalog-avatar";
import { EngineSubtypeIcon } from "@semoss/shared/engine-subtype-icon";
import {
	Alert,
	AlertDescription,
	Button,
	Input,
	Spinner,
	useTheme,
} from "@semoss/ui/next";
import { type CatalogKind, fetchCatalog } from "@/api/catalog";
import { moduleUrlFor } from "@/config/profiles";
import type {
	CatalogItem,
	DesktopInstanceProfile,
	InstanceConfig,
} from "@/types";

interface CatalogViewProps {
	kind: CatalogKind;
	profile: DesktopInstanceProfile;
	config: InstanceConfig;
	onOpenItem: (item: CatalogItem) => void;
}

const labels: Record<
	CatalogKind,
	{ title: string; description: string; empty: string }
> = {
	apps: {
		title: "Apps",
		description: "Applications and workspaces available on this instance.",
		empty: "No apps are available.",
	},
	models: {
		title: "Models",
		description: "Language, embedding, and specialized model engines.",
		empty: "No model engines are available.",
	},
	vectors: {
		title: "Vectors",
		description: "Vector stores and knowledge retrieval engines.",
		empty: "No vector engines are available.",
	},
	databases: {
		title: "Databases",
		description: "Structured data sources available to your account.",
		empty: "No database engines are available.",
	},
	functions: {
		title: "Functions",
		description: "Callable function engines available to your account.",
		empty: "No function engines are available.",
	},
};

export const CatalogView = ({
	kind,
	profile,
	config,
	onOpenItem,
}: CatalogViewProps) => {
	const [items, setItems] = useState<CatalogItem[]>([]);
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const { resolvedTheme } = useTheme();
	const label = labels[kind];

	const load = useCallback(async () => {
		setIsLoading(true);
		setError("");
		try {
			setItems(await fetchCatalog(profile, config, kind));
		} catch (loadError: unknown) {
			setError(
				loadError instanceof Error
					? loadError.message
					: `Unable to load ${label.title.toLowerCase()}.`,
			);
		} finally {
			setIsLoading(false);
		}
	}, [config, kind, label.title, profile]);

	useEffect(() => {
		void load();
	}, [load]);

	const filteredItems = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		if (!normalizedSearch) return items;
		return items.filter((item) =>
			[item.name, item.type, item.subtype, item.description]
				.filter(Boolean)
				.some((value) =>
					String(value).toLowerCase().includes(normalizedSearch),
				),
		);
	}, [items, search]);

	return (
		<div className="mx-auto flex max-w-6xl flex-col">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-semibold text-3xl">{label.title}</h1>
					<p className="mt-2 text-muted-foreground">
						{label.description}
					</p>
				</div>
				<label
					htmlFor={`catalog-search-${kind}`}
					className="relative block w-full max-w-sm"
				>
					<span className="sr-only">Search {label.title}</span>
					<Search
						aria-hidden="true"
						className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
					/>
					<Input
						id={`catalog-search-${kind}`}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={`Search ${label.title.toLowerCase()}`}
						className="pl-9"
					/>
				</label>
			</div>

			{error ? (
				<Alert variant="destructive" className="mt-6">
					<AlertDescription className="flex items-center justify-between gap-4">
						<span>{error}</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => void load()}
						>
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			{isLoading ? (
				<output
					className="flex min-h-64 items-center justify-center gap-3"
					aria-live="polite"
				>
					<Spinner />
					<span>Loading {label.title.toLowerCase()}...</span>
				</output>
			) : null}

			{!isLoading && !error ? (
				filteredItems.length > 0 ? (
					<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{filteredItems.map((item) => (
							<button
								key={item.id}
								type="button"
								className="min-h-40 rounded-xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								onClick={() => onOpenItem(item)}
							>
								<div className="flex items-start gap-3">
									{kind === "apps" ? (
										<AppCatalogAvatar
											name={item.name}
											imageUrl={`${moduleUrlFor(profile)}/api/project-${encodeURIComponent(item.id)}/projectImage/download?theme=${encodeURIComponent(resolvedTheme)}`}
											className="size-12 shrink-0 rounded text-lg"
										/>
									) : (
										<EngineSubtypeIcon
											engineType={item.type}
											engineSubtype={item.subtype}
											alt=""
											className="size-12 shrink-0 object-contain"
										/>
									)}
									<div className="min-w-0 flex-1">
										<h2 className="truncate font-semibold">
											{item.name}
										</h2>
										<p className="mt-1 text-muted-foreground text-xs uppercase tracking-wide">
											{item.subtype || item.type}
										</p>
									</div>
									{item.favorite ? (
										<Star
											aria-label="Favorite"
											className="size-4 fill-current text-primary"
										/>
									) : null}
								</div>
								<p className="mt-5 line-clamp-3 text-muted-foreground text-sm">
									{item.description ||
										`Open ${item.name} details and workbench.`}
								</p>
							</button>
						))}
					</div>
				) : (
					<div className="mt-6 flex min-h-64 items-center justify-center rounded-xl border border-border/70 border-dashed bg-card/40 text-muted-foreground">
						{search ? "No matching results." : label.empty}
					</div>
				)
			) : null}
		</div>
	);
};

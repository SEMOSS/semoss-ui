import { SquareArrowOutUpRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EngineSubtypeIcon } from "@semoss/shared/engine-subtype-icon";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	H1,
	Markdown,
	Spinner,
} from "@semoss/ui/next";
import type { CatalogKind } from "@/api/catalog";
import {
	type CatalogWorkbenchData,
	fetchCatalogWorkbench,
} from "@/api/workbench";
import type {
	CatalogItem,
	DesktopInstanceProfile,
	InstanceConfig,
} from "@/types";

interface CatalogWorkbenchViewProps {
	kind: CatalogKind;
	item: CatalogItem;
	profile: DesktopInstanceProfile;
	config: InstanceConfig;
	onOpenWorkbench?: () => void;
}

const baseTabs = ["Overview", "Usage", "Access"] as const;
type WorkbenchTab = (typeof baseTabs)[number] | "Dependencies";

const readText = (resource: Record<string, unknown>, key: string): string => {
	const value = resource[key];
	return typeof value === "string" ? value : "";
};

export const CatalogWorkbenchView = ({
	kind,
	item,
	profile,
	config,
	onOpenWorkbench,
}: CatalogWorkbenchViewProps) => {
	const [data, setData] = useState<CatalogWorkbenchData | null>(null);
	const [tab, setTab] = useState<WorkbenchTab>("Overview");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	const tabs = useMemo<WorkbenchTab[]>(
		() => [
			"Overview",
			...(kind === "apps" ? (["Dependencies"] as const) : []),
			"Usage",
			"Access",
		],
		[kind],
	);

	const load = useCallback(async () => {
		setIsLoading(true);
		setError("");
		try {
			setData(await fetchCatalogWorkbench(profile, config, kind, item));
		} catch (loadError: unknown) {
			setError(
				loadError instanceof Error
					? loadError.message
					: `Unable to load ${item.name}.`,
			);
		} finally {
			setIsLoading(false);
		}
	}, [config, item, kind, profile]);

	useEffect(() => {
		void load();
	}, [load]);

	if (isLoading) {
		return (
			<output className="flex min-h-96 items-center justify-center gap-3">
				<Spinner />
				<span>Loading {item.name}...</span>
			</output>
		);
	}

	if (error || !data) {
		return (
			<Alert variant="destructive" className="mx-auto max-w-3xl">
				<AlertDescription className="flex items-center justify-between gap-4">
					<span>{error || `Unable to load ${item.name}.`}</span>
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
		);
	}

	const resource = data.resource;
	const description =
		readText(resource, "description") || item.description || "";
	const markdown = readText(resource, "markdown");

	return (
		<div className="mx-auto max-w-6xl">
			<div className="flex items-start gap-4">
				{kind === "apps" ? null : (
					<EngineSubtypeIcon
						engineType={item.type}
						engineSubtype={item.subtype}
						alt=""
						className="size-16 shrink-0 object-contain"
					/>
				)}
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">
							{item.subtype || item.type}
						</Badge>
						<Badge variant="secondary">{data.permission}</Badge>
					</div>
					<H1 className="mt-3">{item.name}</H1>
					<p className="mt-2 break-all font-mono text-muted-foreground text-sm">
						{item.id}
					</p>
				</div>
				{onOpenWorkbench ? (
					<Button type="button" onClick={onOpenWorkbench}>
						<SquareArrowOutUpRight aria-hidden="true" />
						Workbench
					</Button>
				) : null}
			</div>

			<div className="mt-8 flex gap-1 border-border/70 border-b">
				{tabs.map((candidate) => (
					<button
						key={candidate}
						type="button"
						className={`border-b-2 px-3 py-2 font-medium text-sm ${
							tab === candidate
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground"
						}`}
						onClick={() => setTab(candidate)}
					>
						{candidate}
					</button>
				))}
			</div>

			{tab === "Overview" ? (
				<section className="space-y-7 py-8">
					<div>
						<h2 className="font-semibold text-lg">Overview</h2>
						<p className="mt-3 max-w-3xl whitespace-pre-wrap text-muted-foreground">
							{description || "No description has been provided."}
						</p>
					</div>
					{data.modelMetadata ? (
						<div>
							<h2 className="font-semibold text-lg">
								Model metadata
							</h2>
							<dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{Object.entries(data.modelMetadata)
									.filter(
										([, value]) =>
											value !== null &&
											value !== undefined &&
											typeof value !== "object",
									)
									.map(([key, value]) => (
										<div
											key={key}
											className="rounded-lg border border-border/70 p-3"
										>
											<dt className="text-muted-foreground text-xs uppercase tracking-wide">
												{key}
											</dt>
											<dd className="mt-1 break-words text-sm">
												{String(value)}
											</dd>
										</div>
									))}
							</dl>
						</div>
					) : null}
					{markdown ? (
						<div>
							<h2 className="mb-3 font-semibold text-lg">
								Details
							</h2>
							<Markdown variant="document">{markdown}</Markdown>
						</div>
					) : null}
				</section>
			) : null}

			{tab === "Dependencies" ? (
				<section className="py-8">
					<h2 className="font-semibold text-lg">Dependencies</h2>
					{data.dependencies.length > 0 ? (
						<div className="mt-4 grid gap-3 md:grid-cols-2">
							{data.dependencies.map((dependency) => (
								<div
									key={dependency.engine_id}
									className="rounded-lg border border-border/70 p-4"
								>
									<p className="font-medium">
										{dependency.engine_name}
									</p>
									<p className="mt-1 text-muted-foreground text-sm">
										{dependency.engine_subtype ||
											dependency.engine_type}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className="mt-3 text-muted-foreground">
							This app has no engine dependencies.
						</p>
					)}
				</section>
			) : null}

			{tab === "Usage" ? (
				<section className="py-8">
					<h2 className="font-semibold text-lg">Usage</h2>
					<p className="mt-3 text-muted-foreground">
						This resource is available through SEMOSS with ID{" "}
						<code>{item.id}</code>. Type-specific query, upload, and
						execution tools will be added here as their workbench
						panels are ported.
					</p>
				</section>
			) : null}

			{tab === "Access" ? (
				<section className="py-8">
					<h2 className="font-semibold text-lg">Access</h2>
					<p className="mt-3 text-muted-foreground">
						Your effective SEMOSS permission is{" "}
						<strong className="text-foreground">
							{data.permission}
						</strong>
						. AI Core inherits access from the connected instance.
					</p>
				</section>
			) : null}
		</div>
	);
};

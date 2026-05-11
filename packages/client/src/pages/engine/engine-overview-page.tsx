import { observer } from "mobx-react-lite";
import { Badge, H4, Markdown, P, Separator } from "@semoss/ui/next";
import { useEngine, useRootStore } from "@/hooks";

const formatMetaLabel = (value: string) => {
	return value
		.replace(/[_-]+/g, " ")
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export const EngineOverviewPage = observer(() => {
	const { active } = useEngine();
	const { configStore } = useRootStore();

	// filter metakeys to the ones we want
	const engineMetaKeys = configStore.store.config.databaseMetaKeys.filter(
		(k) => {
			return (
				k.metakey !== "description" &&
				k.metakey !== "markdown" &&
				k.metakey !== "tags"
			);
		},
	);

	// Custom markdown components
	const markdownComponents = {
		p: ({
			children,
			...props
		}: React.HTMLAttributes<HTMLParagraphElement>) => (
			<P {...props}>{children}</P>
		),
	};

	const hasMetaSections = engineMetaKeys.some(
		(k) =>
			active.metadata[k.metakey] !== undefined &&
			Array.isArray(active.metadata[k.metakey]),
	);

	return (
		<div className="relative z-0">
			<section className="mb-1 pb-2 last:mb-0">
				<H4 className="mb-2" data-testid="engine-overview-header">
					Details
				</H4>
				{active.metadata.markdown ? (
					<div>
						<Markdown
							data-testid="engine-overview-markdown"
							components={markdownComponents}
						>
							{active.metadata.markdown as string}
						</Markdown>
					</div>
				) : (
					<div className="text-muted-foreground">
						No description available
					</div>
				)}
			</section>
			{hasMetaSections && <Separator className="mb-3" />}
			{engineMetaKeys.map((k) => {
				if (
					active.metadata[k.metakey] === undefined ||
					!Array.isArray(active.metadata[k.metakey])
				) {
					return null;
				}

				return (
					<section
						key={k.metakey}
						className="mb-1 border-border border-b pb-2 last:mb-0 last:border-b-0"
					>
						<H4 className="mb-2">
							{formatMetaLabel(String(k.metakey))}
						</H4>
						{k.display_options === "multi-checklist" ||
						k.display_options === "multi-select" ||
						k.display_options === "multi-typeahead" ||
						k.display_options === "select-box" ? (
							<div className="flex flex-row flex-wrap gap-2">
								{(active.metadata[k.metakey] as string[]).map(
									(tag) => {
										if (tag === "") return null;
										return (
											<Badge
												key={tag}
												variant="default"
												data-testid="tag-chip"
											>
												{tag}
											</Badge>
										);
									},
								)}
							</div>
						) : (
							String(active.metadata[k.metakey] || "")
						)}
					</section>
				);
			})}
		</div>
	);
});

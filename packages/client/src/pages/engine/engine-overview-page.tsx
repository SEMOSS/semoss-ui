import { observer } from "mobx-react-lite";
import { Badge, Markdown } from "@semoss/ui/next";
import { DatabaseStatistics } from "@/components/database/DatabaseStatistics";
import { Section } from "@/components/ui";
import { useEngine, useRootStore } from "@/hooks";
import { removeUnderscores } from "@/utility";

export const EngineOverviewPage = observer(() => {
	const { type, active } = useEngine();
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

	return (
		<div className="relative z-0">
			<Section>
				<Section.Header data-testid="engine-overview-header">
					Details
				</Section.Header>
				{active.metadata.markdown ? (
					<div className="overflow-scroll">
						<Markdown data-testid="engine-overview-markdown">
							{active.metadata.markdown as string}
						</Markdown>
					</div>
				) : (
					<div className="text-muted-foreground">
						No Markdown available
					</div>
				)}
			</Section>
			{engineMetaKeys.map((k) => {
				if (
					active.metadata[k.metakey] === undefined ||
					!Array.isArray(active.metadata[k.metakey])
				) {
					return null;
				}

				return (
					<Section key={k.metakey}>
						<Section.Header>
							{removeUnderscores(k.metakey)}
						</Section.Header>
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
					</Section>
				);
			})}
			{type === "DATABASE" && (
				<Section>
					<Section.Header>Statistics</Section.Header>
					<DatabaseStatistics id={active.id} />
				</Section>
			)}
		</div>
	);
});

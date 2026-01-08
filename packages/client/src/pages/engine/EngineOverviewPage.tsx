import { observer } from "mobx-react-lite";
import { Chip, Markdown, Stack, styled } from "@semoss/ui";
import { DatabaseStatistics } from "@/components/database/DatabaseStatistics";
import { Section } from "@/components/ui";
import { useEngine, useRootStore } from "@/hooks";
import { removeUnderscores } from "@/utility";

const StyledPage = styled("div")(() => ({
	position: "relative",
	zIndex: "0",
}));

const StyledMarkdownContainer = styled(Stack)(() => ({
	overflow: "scroll",
}));

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
		<StyledPage>
			<Section>
				<Section.Header data-testid="engine-overview-header">
					Details
				</Section.Header>
				{active.metadata.markdown ? (
					<StyledMarkdownContainer>
						<Markdown data-testid="engine-overview-markdown">
							{active.metadata.markdown as string}
						</Markdown>
					</StyledMarkdownContainer>
				) : (
					<div> No Markdown available</div>
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
							<Stack
								direction={"row"}
								spacing={1}
								flexWrap={"wrap"}
							>
								{(active.metadata[k.metakey] as string[]).map(
									(tag) => {
										if (tag === "") return null;
										return (
											<Chip
												key={tag}
												label={tag}
												color={"primary"}
												data-testid="tag-chip"
											></Chip>
										);
									},
								)}
							</Stack>
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
		</StyledPage>
	);
});

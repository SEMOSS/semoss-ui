import { styled, Table, Typography } from "@semoss/ui";
import { StorageFileExplorer } from "@/components/engine/StorageFileExplorer";
import { FileTable } from "@/components/settings";
import { useEngine } from "@/hooks";
import type { ENGINE_TYPES } from "@/types";

const StyledContainer = styled("div")(({ theme }) => ({
	width: "100%",
	display: "flex",
	alignSelf: "stretch",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(3),
}));

const StyledTableContainer = styled(Table.Container)({
	borderRadius: "12px",
	// background: #FFF;
	/* Devias Drop Shadow */
	boxShadow: "0px 5px 22px 0px rgba(0, 0, 0, 0.06)",
});

const StyledTopDiv = styled("div")(() => ({
	display: "flex",
	width: "100%",
	justifyContent: "space-between",
}));

type EngineFilePageProps = {
	engineType: ENGINE_TYPES;
};

export const EngineFilePage: React.FC<EngineFilePageProps> = ({
	engineType,
}) => {
	const { active } = useEngine();

	return (
		<StyledContainer>
			{engineType === "VECTOR" && (
				<>
					<StyledTopDiv>
						<Typography variant="h6">File Explorer</Typography>
					</StyledTopDiv>
					<StyledTableContainer>
						<FileTable id={active.id} />
					</StyledTableContainer>
				</>
			)}

			<StyledTableContainer>
				{engineType === "STORAGE" && (
					<StorageFileExplorer id={active.id} />
				)}
			</StyledTableContainer>
		</StyledContainer>
	);
};

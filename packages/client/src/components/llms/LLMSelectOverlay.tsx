import { Clear } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Autocomplete, IconButton, Modal, Select, Stack } from "@semoss/ui";

interface LLMOverlayProps {
	/** List of LLMs to select from */
	llmList: Record<string, string>[];
	/** Id of the selected LLM */
	selectedLLM: string;
	/** Method called when a LLM is selected */
	onSelect: (id: string) => void;
	/** Method called to close overlay  */
	onClose: () => void;
}

/**
 * TODO: If you dont pass llmList make call to get all models
 */

export const LLMSelectOverlay = observer((props: LLMOverlayProps) => {
	const {
		llmList,
		selectedLLM,
		onSelect = () => null,
		onClose = () => null,
	} = props;

	return (
		<>
			<Modal.Title>
				<Stack direction="row" justifyContent="space-between">
					<span>Select model to use across builder</span>
					<IconButton
						size="small"
						title="close"
						aria-label="close"
						onClick={onClose}
					>
						<Clear />
					</IconButton>
				</Stack>
			</Modal.Title>
			<Modal.Content>
				<Select
					fullWidth={true}
					size="small"
					value={selectedLLM}
					onChange={(e) => {
						onSelect(e.target.value);
						onClose();
					}}
				>
					{llmList.map((LLM) => (
						<Select.Item key={LLM.value} value={LLM.value}>
							{LLM.label}
						</Select.Item>
					))}
				</Select>
			</Modal.Content>
		</>
	);
});

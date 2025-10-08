import { Button, Modal } from "@semoss/ui";
import type { Agent } from "@/types";

export interface AgentModalProps {
	open: boolean;
	onClose: (newAgentId?: string) => void;
	agentInfo: Agent | null;
}

/**
 * Renders a modal to create a new agent
 *
 * @component
 */
export const AgentModal = ({ open, onClose, agentInfo }: AgentModalProps) => {
	// TODO: Travon

	/**
	 * Constants
	 */
	const isCreatingNew = agentInfo === null;

	/**
	 * Functions
	 */
	const createNewAgent = async () => {
		// Travon TODO: Implement create new agent logic
		onClose("new-agent-id");
	};

	return (
		<Modal open={open} onClose={() => onClose()}>
			<div>
				{isCreatingNew
					? "Create Agent Modal"
					: `View Agent Modal: ${JSON.stringify(agentInfo)}`}
			</div>
			<Button onClick={createNewAgent}>
				Close Modal and Return New Agent ID
			</Button>
		</Modal>
	);
};

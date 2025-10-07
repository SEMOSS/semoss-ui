import { Modal } from "@semoss/ui";
import type { Agent } from "@/types";

export interface AgentModalProps {
	open: boolean;
	onClose: () => void;
	agentInfo: Agent | null;
}

/**
 * Renders a modal to create a new agent
 *
 * @component
 */
export const AgentModal = ({ open, onClose }: AgentModalProps) => {
	return (
		<Modal open={open} onClose={onClose}>
			<div>Create Agent Modal</div>
		</Modal>
	);
};

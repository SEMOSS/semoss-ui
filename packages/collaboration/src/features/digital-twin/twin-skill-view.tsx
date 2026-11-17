import { useState } from "react";
import { Button, Dialog, DialogTrigger } from "@semoss/ui/next";
import { TwinSkillContent } from "./twin-skill-content";

interface TwinSkillViewProps {
	/** Attached skill to read on demand. */
	skill: { id: string; name: string };
}

/** Keep the row as the focus destination when its instructions are closed. */
export function TwinSkillView({ skill }: TwinSkillViewProps) {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="pointer-coarse:min-h-11"
					aria-label={`View ${skill.name}`}
				>
					View
				</Button>
			</DialogTrigger>
			{isOpen && <TwinSkillContent skill={skill} />}
		</Dialog>
	);
}

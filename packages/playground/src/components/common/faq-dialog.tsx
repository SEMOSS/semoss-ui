import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Separator,
	toast,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";

interface FaqDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const FaqDialog = ({ open, onOpenChange }: FaqDialogProps) => {
	const { chat } = useChat();
	const navigate = useNavigate();
	const [isDuplicating, setIsDuplicating] = useState(false);
	const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

	const sections = [
		{
			title: "Issuer Requirements",
			items: [
				{
					label: "What are the requirements to become a Ginnie Mae MBS issuer?",
					roomId: "fa2b69bd-96c6-4094-9d4e-3e64282db815",
				},
				{
					label: "What are the eligibility requirements for FHA approval?",
					roomId: "f2cd1b07-2e28-46e7-a669-2a7f4a71159c",
				},
			],
		},
		{
			title: "Financial Requirements",
			items: [
				{
					label: "What are the net worth requirements for Ginnie Mae issuers?",
					roomId: "432b8bc2-6f88-43e6-b687-d6eefda939c0",
				},
				{
					label: "What insurance requirements must issuers maintain?",
					roomId: "82eccfed-42f3-4531-b477-7dda054ccd41",
				},
			],
		},
		{
			title: "Documentation",
			items: [
				{
					label: "What documents are required for issuer application?",
					roomId: "2e2d83ad-48f0-4d0b-bbea-ab3a70801ffb",
				},
				{
					label: "How do I submit required financial statements?",
					roomId: "2adb0730-a623-4668-9437-486727b850a7",
				},
			],
		},
	] as const;

	const handleDuplicateRoom = async (roomId: string) => {
		if (isDuplicating) {
			return;
		}

		try {
			setIsDuplicating(true);
			setActiveRoomId(roomId);

			const duplicatedRoomId = await chat.duplicateRoom(roomId);

			onOpenChange(false);
			navigate(`/room/${duplicatedRoomId}`);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			toast.error(`Failed to open FAQ room. Error: ${message}`);
		} finally {
			setIsDuplicating(false);
			setActiveRoomId(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Frequently Asked Questions</DialogTitle>
				</DialogHeader>
				<div className="space-y-6 py-4">
					{sections.map((section, sectionIndex) => (
						<div key={section.title} className="space-y-3">
							<div className="font-semibold text-foreground text-sm">
								{section.title}
							</div>
							<div className="flex flex-col gap-2">
								{section.items.map((item) => (
									<Button
										key={item.roomId}
										variant="ghost"
										className="h-auto w-full justify-start whitespace-normal text-left"
										disabled={isDuplicating}
										onClick={() =>
											handleDuplicateRoom(item.roomId)
										}
									>
										<span className="flex-1 text-sm">
											{item.label}
										</span>
										{isDuplicating &&
										activeRoomId === item.roomId ? (
											<span className="text-muted-foreground text-xs">
												Opening...
											</span>
										) : null}
									</Button>
								))}
							</div>
							{sectionIndex < sections.length - 1 ? (
								<Separator />
							) : null}
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRightIcon, CircleHelpIcon } from "lucide-react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
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
			<DialogContent className="overflow-hidden p-0 sm:max-w-2xl [&>button]:text-white/80 [&>button]:hover:text-white">
				<div className="bg-[#12355b] px-6 py-4">
					<DialogHeader className="flex flex-row items-center justify-between space-y-0">
						<div className="flex items-center gap-3">
							<span className="flex size-7 items-center justify-center rounded-full border border-white/30 bg-white/10">
								<CircleHelpIcon className="size-4 text-white" />
							</span>
							<DialogTitle className="text-lg text-white">
								Frequently Asked Questions
							</DialogTitle>
						</div>
					</DialogHeader>
				</div>
				<div className="space-y-6 px-6 py-5">
					<p className="text-sm text-slate-600">
						Click on any question below to get a detailed response from
						the PolicyWise agent.
					</p>
					{sections.map((section, sectionIndex) => (
						<div key={section.title} className="space-y-3">
							<div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
								{section.title}
							</div>
							<div className="flex flex-col gap-2">
								{section.items.map((item) => (
									<Button
										key={item.roomId}
										variant="outline"
										className="h-auto w-full justify-between gap-3 rounded-lg border-slate-200 bg-white px-4 py-3 text-left text-slate-900 shadow-sm hover:bg-slate-50"
										disabled={isDuplicating}
										onClick={() =>
											handleDuplicateRoom(item.roomId)
										}
									>
										<span className="flex-1 whitespace-normal text-sm">
											{item.label}
										</span>
										{isDuplicating &&
										activeRoomId === item.roomId ? (
											<span className="text-xs text-slate-400">
												Opening...
											</span>
										) : (
											<ChevronRightIcon className="size-4 text-slate-400" />
										)}
									</Button>
								))}
							</div>
							{sectionIndex < sections.length - 1 ? (
								<div className="pt-2" />
							) : null}
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};

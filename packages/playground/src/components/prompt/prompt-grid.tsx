import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { PromptDetailsModal } from "../../components/prompt/prompt-details-modal";
import { EditPromptModal } from "./edit-prompt-modal";
import { PromptCard } from "./prompt-card";

export type Prompt = {
	ID: string;
	TITLE: string;
	CONTEXT?: string;
	INTENT?: string;
	VERSION?: number;
	CREATED_BY?: string;
	DATE_CREATED?: string | Date | null;
	GLOBAL?: boolean;
	tags?: string[];
	metaKeys?: Record<string, string[]>;
};

type SelectedCategory = { label: string; value: string };

interface PromptGridProps {
	selectedCategory: SelectedCategory;
	globalPrompts: Prompt[];
	myPrompts: Prompt[];
	refresh: () => void | Promise<void>;
	isTextFieldFocused?: boolean;
}

function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(() => {
		if (typeof window === "undefined" || !window.matchMedia) return false;
		return window.matchMedia(query).matches;
	});

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;

		const mql = window.matchMedia(query);
		const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

		setMatches(mql.matches);

		if (mql.addEventListener) {
			mql.addEventListener("change", onChange);
			return () => mql.removeEventListener("change", onChange);
		}

		// eslint-disable-next-line deprecation/deprecation
		mql.addListener(onChange);
		// eslint-disable-next-line deprecation/deprecation
		return () => mql.removeListener(onChange);
	}, [query]);

	return matches;
}

function getPromptText(p: Prompt): string {
	return String(p.CONTEXT ?? "").trim();
}

export const PromptGrid = observer(function PromptGrid({
	selectedCategory,
	globalPrompts,
	myPrompts,
	refresh,
	isTextFieldFocused = false,
}: PromptGridProps) {
	const isMobile = useMediaQuery("(max-width: 640px)");
	const { actions } = useInsight();
	const location = useLocation();

	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
	const [selectedPromptForDetails, setSelectedPromptForDetails] =
		useState<Prompt | null>(null);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);

	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error" | "info" | "warning";
	}>({
		open: false,
		message: "",
		severity: "success",
	});

	// auto-hide to match Snackbar autoHideDuration={6000}
	useEffect(() => {
		if (!snackbar.open) return;
		const t = window.setTimeout(() => {
			setSnackbar((prev) => ({ ...prev, open: false }));
		}, 6000);
		return () => window.clearTimeout(t);
	}, [snackbar.open]);

	const alertTone =
		snackbar.severity === "success"
			? "bg-emerald-600"
			: snackbar.severity === "error"
				? "bg-red-600"
				: snackbar.severity === "warning"
					? "bg-amber-600"
					: "bg-slate-700";

	const listToRender = useMemo(() => {
		if (selectedCategory.label === "My Prompts") {
			return myPrompts.length ? myPrompts : [];
		}
		return globalPrompts.length ? globalPrompts : [];
	}, [
		selectedCategory.label,
		myPrompts,
		myPrompts.length,
		globalPrompts,
		globalPrompts.length,
	]);

	const handleEdit = (prompt: Prompt) => {
		setCurrentPrompt(prompt);
		setIsEditModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		const response = await actions.run<[boolean]>(
			`DeletePrompt(map={"promptId":'${id}'});`,
		);

		const { output, operationType } = response.pixelReturn[0];
		if ((operationType ?? "").includes("ERROR")) {
			throw new Error(output as unknown as string);
		}

		console.log("output", output);

		await refresh();
		setSnackbar({
			open: true,
			message: "Prompt deleted successfully",
			severity: "success",
		});
	};

	const handleSave = async (updatedPrompt: Prompt) => {
		const title = (updatedPrompt?.TITLE ?? "").trim();
		const text = getPromptText(updatedPrompt);

		if (!title || !text) {
			setSnackbar({
				open: true,
				message: "Title and prompt text required",
				severity: "error",
			});
			return;
		}

		const map = {
			id: String(updatedPrompt.ID),
			title,
			context: text,
		};

		const response = await actions.run<[boolean]>(
			`UpdatePrompt(map=${JSON.stringify(map)});`,
		);

		const { output, operationType } = response.pixelReturn[0];
		if ((operationType ?? "").includes("ERROR")) {
			throw new Error(output as unknown as string);
		}

		await refresh();
		setIsEditModalOpen(false);
		setSnackbar({
			open: true,
			message: "Prompt updated successfully",
			severity: "success",
		});
	};

	const handleAddNew = (_newPrompt: Prompt) => {
		setIsEditModalOpen(false);
		setSnackbar({
			open: true,
			message: "New prompt created successfully",
			severity: "success",
		});
	};

	const handleCloseSnackbar = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	const handleShowDetails = (prompt: Prompt) => {
		setSelectedPromptForDetails(prompt);
		setIsDetailsModalOpen(true);
	};

	const handleCloseDetails = () => {
		setIsDetailsModalOpen(false);
		setSelectedPromptForDetails(null);
	};

	const handleCopyFromModal = (text: string) => {
		navigator.clipboard.writeText(text);
		setSnackbar({
			open: true,
			message: "Successfully copied to clipboard",
			severity: "success",
		});
	};
	console.log("sample prompt:", myPrompts?.[0]);
	return (
		<>
			{!isMobile && (
				<div className="grid grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-4">
					{Array.isArray(listToRender) &&
						listToRender.map((prompt) => (
							<div key={prompt.ID} className="col-span-1">
								<PromptCard
									prompt={prompt}
									category={selectedCategory.label}
									onEdit={() => handleEdit(prompt)}
									onDelete={() => handleDelete(prompt.ID)}
									onShowDetails={() =>
										handleShowDetails(prompt)
									}
								/>
							</div>
						))}
				</div>
			)}

			{isMobile && location.pathname === "/prompt-library" && (
				<div className="relative flex flex-col flex-nowrap gap-1 px-1">
					{Array.isArray(listToRender) &&
						listToRender.map((prompt) => (
							<div
								key={prompt.ID}
								className="flex w-fit flex-[0_0_auto]"
							>
								<PromptCard
									prompt={prompt}
									category={selectedCategory.label}
									onEdit={() => handleEdit(prompt)}
									onDelete={() => handleDelete(prompt.ID)}
									onShowDetails={() =>
										handleShowDetails(prompt)
									}
								/>
							</div>
						))}
				</div>
			)}

			{isMobile && location.pathname === "/" && (
				<div
					style={{
						position: "fixed",
						top: isTextFieldFocused ? "22%" : "40%",
						width: "100%",
						overflowX: "auto",
					}}
					className="prompt-grid-scroll"
				>
					<div className="left-0 flex flex-nowrap gap-1 px-1">
						{Array.isArray(listToRender) &&
							listToRender.map((prompt) => (
								<div
									key={prompt.ID}
									className="flex w-fit flex-[0_0_auto]"
								>
									<PromptCard
										prompt={prompt}
										category={selectedCategory.label}
										onEdit={() => handleEdit(prompt)}
										onDelete={() => handleDelete(prompt.ID)}
										onShowDetails={() =>
											handleShowDetails(prompt)
										}
									/>
								</div>
							))}
						<div style={{ width: "20px", flexShrink: 0 }} />
					</div>
				</div>
			)}

			<PromptDetailsModal
				open={isDetailsModalOpen}
				onClose={handleCloseDetails}
				prompt={selectedPromptForDetails}
				onUse={null}
				onCopy={handleCopyFromModal}
			/>

			{isEditModalOpen && currentPrompt && (
				<EditPromptModal
					key={currentPrompt.ID}
					prompt={currentPrompt}
					open={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					onSave={
						(currentPrompt.ID || "").includes("new")
							? handleAddNew
							: handleSave
					}
					isNewPrompt={(currentPrompt.ID || "").includes("new")}
				/>
			)}

			{snackbar.open && (
				<div className="fixed top-4 right-4 z-50">
					<output
						className={`flex min-w-[260px] max-w-[420px] items-start justify-between gap-3 rounded-md ${alertTone} px-4 py-3 text-sm text-white shadow-lg`}
						aria-live="polite"
					>
						<div className="pr-1">{snackbar.message}</div>
						<button
							type="button"
							onClick={handleCloseSnackbar}
							className="rounded-sm p-1/2 opacity-90 hover:opacity-100"
							aria-label="Close notification"
						>
							<X className="h-4 w-4" />
						</button>
					</output>
				</div>
			)}
		</>
	);
});

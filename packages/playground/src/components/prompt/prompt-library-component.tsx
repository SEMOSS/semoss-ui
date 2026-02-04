import { Search as SearchIcon, X } from "lucide-react";
import type React from "react";
import { useId, useMemo, useState } from "react";
import { Button } from "@semoss/ui/next";
import { usePixel } from "@/hooks";
import type { Prompt } from "@/types/prompt";

interface PromptLibraryComponentProps {
	/** Callback triggered when the tool modal is closed */
	onClose: (success: boolean, prompt?: Prompt) => void;
}

type TagMeta = {
	metaKey: "tag";
	metaValue: string;
	count: number;
};

// Use the shape this component reads, while still being assignable to `Prompt`
type PromptRow = Prompt & {
	id: string;
	title?: string | null;
	intent?: string | null;
	tags?: string[] | null;
};

export const PromptLibraryComponent: React.FC<PromptLibraryComponentProps> = ({
	onClose,
}) => {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<string>("");

	const searchId = useId();
	const filterId = useId();

	const getAllTags = usePixel<TagMeta[]>(
		`GetPromptMetaValues ( metaKeys = [ "tag" ] ) ;`,
		{ data: [] },
	);

	const getPrompts = usePixel<PromptRow[]>(`ListMyPrompts();`, { data: [] });

	const tagOptions = useMemo(() => getAllTags.data ?? [], [getAllTags.data]);
	const prompts = useMemo(() => getPrompts.data ?? [], [getPrompts.data]);

	const filteredPrompts = useMemo(() => {
		const q = search.trim().toLowerCase();

		return prompts.filter((p) => {
			const title = String(p?.title ?? "").toLowerCase();
			const intent = String(p?.intent ?? "").toLowerCase();

			const matchesSearch = !q || title.includes(q) || intent.includes(q);

			const matchesFilter =
				!filter ||
				(Array.isArray(p?.tags) &&
					p.tags.some((t) => String(t) === String(filter)));

			return matchesSearch && matchesFilter;
		});
	}, [prompts, search, filter]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Select Prompt"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose(false);
			}}
		>
			<div className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
				{/* Title */}
				<div className="flex items-center justify-between border-slate-200 border-b px-4 py-3">
					<div className="font-semibold text-base text-slate-900">
						Select Prompt
					</div>
					<button
						type="button"
						onClick={() => onClose(false)}
						className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
						aria-label="Close"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4">
					<div className="flex flex-col gap-4">
						{/* Search + Filter */}
						<div className="flex w-full items-center gap-3">
							<div className="flex-1">
								<label
									htmlFor={searchId}
									className="mb-1 block font-medium text-slate-600 text-xs"
								>
									Search
								</label>
								<div className="relative">
									<SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 h-4 w-4 text-slate-400" />
									<input
										id={searchId}
										value={search}
										onChange={(e) =>
											setSearch(e.target.value)
										}
										className="h-9 w-full rounded-md border border-slate-200 bg-white pr-3 pl-8 text-slate-700 text-sm outline-none focus:border-slate-300"
										placeholder="Search"
									/>
								</div>
							</div>

							<div className="w-[194px]">
								<label
									htmlFor={filterId}
									className="mb-1 block font-medium text-slate-600 text-xs"
								>
									Filter
								</label>
								<select
									id={filterId}
									value={filter}
									onChange={(e) => setFilter(e.target.value)}
									className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-slate-700 text-sm outline-none focus:border-slate-300"
								>
									<option value="">All</option>
									{tagOptions.map((t) => (
										<option
											key={t.metaValue}
											value={t.metaValue}
										>
											{t.metaValue}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Prompt list */}
						<div className="flex h-[422px] max-h-[40vh] flex-col items-center justify-center overflow-auto px-4">
							{getPrompts.status === "LOADING" ? (
								<output
									aria-live="polite"
									className="flex items-center"
								>
									<div
										className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#86BC25]"
										aria-hidden="true"
									/>
									<span className="sr-only">Loading</span>
								</output>
							) : (
								<div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
									{filteredPrompts.map((p) => {
										const tags = Array.isArray(p.tags)
											? Array.from(
													new Set(p.tags.map(String)),
												)
											: [];

										return (
											<button
												key={p.id}
												type="button"
												onClick={() => onClose(true, p)}
												className="flex h-[130px] w-full cursor-pointer flex-col gap-2 rounded-md border border-transparent bg-slate-50 p-3 text-left hover:border-[#b18950]"
											>
												<div className="flex items-start gap-2">
													<div className="min-w-0 flex-1">
														<div className="truncate font-semibold text-slate-900 text-sm">
															{p.title}
														</div>

														<div className="mt-1 flex flex-wrap gap-1">
															{tags.map((t) => (
																<span
																	key={`${p.id}:${t}`}
																	className="inline-flex items-center rounded-md bg-sky-100 px-2 py-0.5 font-medium text-sky-700 text-xs"
																>
																	{t}
																</span>
															))}
														</div>
													</div>
												</div>

												<div className="line-clamp-3 h-[60px] text-slate-600 text-xs leading-5">
													{p.intent}
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>

						{/* Optional footer action area (kept minimal) */}
						<div className="flex justify-end">
							<Button
								variant="outline"
								onClick={() => onClose(false)}
							>
								Close
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

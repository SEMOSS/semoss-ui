import { ArrowUp } from "lucide-react";
import { useNavigate } from "react-router";
import {
	Button,
	Form,
	FormTextarea,
	P,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { BriefPanel } from "./brief-panel";
import { BriefSuggestions } from "./brief-suggestions";
import { BriefTopicFilter } from "./brief-topic-filter";

const questionSchema = z.object({
	prompt: z
		.string()
		.trim()
		.min(1, "Enter a question.")
		.max(4000, "Keep your question under 4,000 characters."),
});

/** Opens a new chat with a reviewable question; navigation never submits a model request. */
export function BriefAsk({
	topicId,
	onTopicChange,
}: {
	topicId: string;
	onTopicChange: (value: string) => void;
}) {
	const navigate = useNavigate();
	const form = useForm<z.infer<typeof questionSchema>>({
		resolver: zodResolver(questionSchema),
		defaultValues: { prompt: "" },
	});
	const handleOpen = (prompt: string) => {
		void navigate("/new", { state: { prompt, topicId } });
	};
	return (
		<BriefPanel
			title="Ask"
			detail={
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-0 font-mono font-normal text-muted-foreground text-xs"
					onClick={() => {
						void navigate("/new");
					}}
				>
					open chat
				</Button>
			}
		>
			<P className="mb-4 font-mono text-muted-foreground text-sm leading-6">
				Ask across your topics, people and threads.
			</P>
			<BriefSuggestions topicId={topicId} onSelect={handleOpen} />
			<Form
				form={form}
				onSubmit={({ prompt }) => handleOpen(prompt)}
				className="mt-4 rounded-xl border bg-background p-3 focus-within:ring-1 focus-within:ring-ring"
			>
				<FormTextarea
					name="prompt"
					aria-label="Ask anything"
					placeholder="Ask anything…"
					rows={2}
					className="[&_textarea]:min-h-12 [&_textarea]:resize-none [&_textarea]:border-0 [&_textarea]:bg-transparent [&_textarea]:p-1 [&_textarea]:shadow-none [&_textarea]:focus-visible:ring-0"
				/>
				<div className="mt-2 flex items-center justify-between gap-2">
					<BriefTopicFilter
						value={topicId}
						onChange={onTopicChange}
						compact
					/>
					<Button
						type="submit"
						size="icon-sm"
						aria-label="Open question in chat"
						disabled={!form.watch("prompt").trim()}
						className="rounded-full bg-foreground text-background hover:bg-foreground/90"
					>
						<ArrowUp aria-hidden="true" />
					</Button>
				</div>
			</Form>
		</BriefPanel>
	);
}

import { Search } from "lucide-react";
import {
	Button,
	Form,
	FormInput,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";

const schema = z.object({
	query: z.string().max(200, "Search at most 200 characters"),
});
interface TopicEvidenceSearchProps {
	/** Initial query for this selected topic. */
	query: string;
	isBusy: boolean;
	/** Explicit search leaves the owner's profile text and other selections intact. */
	onSearch: (query: string) => void;
}

/** A separate filter form; Enter searches examples rather than applying onboarding. */
export function TopicEvidenceSearch({
	query,
	isBusy,
	onSearch,
}: TopicEvidenceSearchProps) {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { query },
	});
	return (
		<Form
			form={form}
			onSubmit={({ query }) => onSearch(query.trim())}
			className="flex min-w-0 flex-wrap items-end gap-2"
		>
			<FormInput
				name="query"
				label="Search conversation subjects"
				maxLength={200}
				disabled={isBusy}
				className="min-w-0 grow"
			/>
			<Button type="submit" variant="outline" disabled={isBusy}>
				<Search aria-hidden="true" /> Search
			</Button>
		</Form>
	);
}

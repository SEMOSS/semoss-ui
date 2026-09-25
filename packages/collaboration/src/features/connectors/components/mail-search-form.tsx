import {
	Button,
	Form,
	FormCheckbox,
	FormSelect,
	SelectItem,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { OutlookFolder } from "../api/microsoft-schemas";
import { MAIL_DATE_RANGES, type MailSearchFilters } from "../types";
import { ConnectorFormInput } from "./connector-form-input";

const searchSchema = z.object({
	folder: z.string(),
	subject: z.string(),
	from: z.string(),
	unreadOnly: z.boolean(),
	sinceDays: z.enum(["1", "7", "30", "90"]),
});
type SearchValues = z.input<typeof searchSchema>;

interface MailSearchFormProps {
	folders: OutlookFolder[];
	isLoading: boolean;
	onSearch: (filters: MailSearchFilters) => Promise<void>;
}

/** Explicit bounded email search; typing never reads a mailbox. */
export function MailSearchForm({
	folders,
	isLoading,
	onSearch,
}: MailSearchFormProps) {
	const form = useForm<SearchValues>({
		resolver: zodResolver(searchSchema),
		defaultValues: {
			folder: "inbox",
			subject: "",
			from: "",
			unreadOnly: false,
			sinceDays: "7",
		},
	});
	const choices = [
		{ id: "inbox", name: "Inbox" },
		{ id: "sentitems", name: "Sent Items" },
		{ id: "drafts", name: "Drafts" },
		...folders.filter(
			(folder) => !["inbox", "sentitems", "drafts"].includes(folder.id),
		),
	];
	function handleSubmit(values: SearchValues): Promise<void> {
		return onSearch({
			...values,
			sinceDays: MAIL_DATE_RANGES[values.sinceDays ?? "7"],
		});
	}
	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			className="flex flex-col gap-4"
			aria-busy={isLoading}
		>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<FormSelect name="folder" label="Folder" disabled={isLoading}>
					{choices.map((folder) => (
						<SelectItem key={folder.id} value={folder.id}>
							{folder.name || "Unnamed folder"}
						</SelectItem>
					))}
				</FormSelect>
				<FormSelect
					name="sinceDays"
					label="Date range"
					disabled={isLoading}
				>
					{Object.entries(MAIL_DATE_RANGES).map(([value, days]) => (
						<SelectItem key={value} value={value}>
							{days === 1 ? "Last day" : `Last ${days} days`}
						</SelectItem>
					))}
				</FormSelect>
				<ConnectorFormInput
					name="from"
					label="From"
					placeholder="Sender address"
					disabled={isLoading}
				/>
				<ConnectorFormInput
					name="subject"
					label="Subject"
					placeholder="Search subject"
					disabled={isLoading}
				/>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<FormCheckbox
					name="unreadOnly"
					label="Unread only"
					disabled={isLoading}
				/>
				<Button type="submit" disabled={isLoading}>
					{isLoading ? "Loading email…" : "Load email"}
				</Button>
			</div>
		</Form>
	);
}

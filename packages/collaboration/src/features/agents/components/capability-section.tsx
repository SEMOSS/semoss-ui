import { type LucideIcon, Plus, X } from "lucide-react";
import { type ReactNode, type RefObject, useId, useRef, useState } from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogTrigger,
	H3,
	P,
	Small,
} from "@semoss/ui/next";

interface CapabilitySectionItem {
	id: string;
	name: string;
	/** Read-only items are active through the agent or room itself. */
	readOnly?: boolean;
	/** Explains the source of a read-only item. */
	sourceLabel?: string;
}

interface CapabilitySectionBaseProps {
	title: string;
	description: string;
	emptyText: string;
	icon: LucideIcon;
	/** Attached items remain visible even when absent from the catalog. */
	items: CapabilitySectionItem[];
	disabled?: boolean;
	onRemove: (id: string) => void;
}

type CapabilitySectionProps = CapabilitySectionBaseProps &
	(
		| {
				/** Mounted on demand, inside the section's standalone dialog. */
				children: ReactNode;
				onAdd?: never;
				addButtonRef?: never;
		  }
		| {
				/** Opens a picker owned by an ancestor instead of creating a dialog. */
				onAdd: () => void;
				addButtonRef?: RefObject<HTMLButtonElement | null>;
				children?: never;
		  }
	);

/** A compact resource summary with an on-demand picker. */
export function CapabilitySection({
	title,
	description,
	emptyText,
	icon: Icon,
	items,
	disabled,
	onRemove,
	onAdd,
	addButtonRef,
	children,
}: CapabilitySectionProps) {
	const [isOpen, setIsOpen] = useState(false);
	const headingId = useId();
	const addButton = useRef<HTMLButtonElement>(null);
	const section = (
		<section
			aria-labelledby={headingId}
			className="border-b pb-6 last:border-0 last:pb-0"
		>
			<div className="flex flex-wrap items-start gap-3">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
					<Icon className="size-4" aria-hidden="true" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<H3 id={headingId} className="font-medium text-base">
							{title}
						</H3>
						{items.length > 0 && (
							<span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs tabular-nums">
								{items.length} added
							</span>
						)}
					</div>
					<P className="mt-1 text-muted-foreground text-sm">
						{description}
					</P>
				</div>
				{onAdd ? (
					<Button
						ref={(element) => {
							addButton.current = element;
							if (addButtonRef) addButtonRef.current = element;
						}}
						type="button"
						size="sm"
						variant="outline"
						className="min-h-9"
						aria-label={`Add ${title.toLowerCase()}`}
						disabled={disabled}
						onClick={onAdd}
					>
						<Plus aria-hidden="true" /> Add
					</Button>
				) : (
					<DialogTrigger asChild>
						<Button
							ref={addButton}
							type="button"
							size="sm"
							variant="outline"
							className="min-h-9"
							aria-label={`Add ${title.toLowerCase()}`}
							disabled={disabled}
						>
							<Plus aria-hidden="true" /> Add
						</Button>
					</DialogTrigger>
				)}
			</div>
			{items.length === 0 ? (
				<P className="mt-4 rounded-md border border-dashed px-4 py-3 text-muted-foreground text-sm">
					{emptyText}
				</P>
			) : (
				<ul className="mt-3 divide-y">
					{items.map((item) => (
						<li
							key={item.id}
							className="flex min-w-0 items-center gap-3 py-2 pl-3"
						>
							<span
								className="size-1.5 shrink-0 rounded-full bg-primary/60"
								aria-hidden="true"
							/>
							<Small className="wrap-anywhere min-w-0 flex-1 leading-5">
								{item.name}
							</Small>
							{item.readOnly ? (
								<Badge variant="outline">
									{item.sourceLabel ?? "Included"}
								</Badge>
							) : (
								<Button
									type="button"
									size="icon-sm"
									variant="ghost"
									aria-label={`Remove ${item.name}`}
									disabled={disabled}
									onClick={() => {
										// Keep focus in this section after removing its focused row.
										onRemove(item.id);
										addButton.current?.focus();
									}}
								>
									<X
										className="size-4 text-muted-foreground"
										aria-hidden="true"
									/>
								</Button>
							)}
						</li>
					))}
				</ul>
			)}
		</section>
	);
	if (onAdd) return section;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{section}
			{isOpen && children}
		</Dialog>
	);
}

/**
 * Form primitives — adapters over the shared @semoss/ui components.
 *  - Input / Textarea → @semoss/ui Input / Textarea (design-system styling).
 *  - Select → the shared Radix Select, but exposing this app's native-<select>
 *    API (value / onChange / <option> children) so the ~20 call sites don't change.
 *    Empty-string option values ("" placeholders) are mapped to a sentinel because
 *    Radix disallows empty item values.
 */

import {
	Children,
	Fragment,
	forwardRef,
	type InputHTMLAttributes,
	isValidElement,
	type ReactElement,
	type ReactNode,
	type TextareaHTMLAttributes,
} from "react";
import {
	cn,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
	Input as UIInput,
	Select as UISelect,
	Textarea as UITextarea,
} from "@semoss/ui/next";

export const Input = forwardRef<
	HTMLInputElement,
	InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
	return <UIInput ref={ref} className={cn(className)} {...props} />;
});

export const Textarea = forwardRef<
	HTMLTextAreaElement,
	TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
	return (
		<UITextarea
			ref={ref}
			className={cn("resize-none leading-relaxed", className)}
			{...props}
		/>
	);
});

// ── Select adapter (native-<select> API → shared Radix Select) ──────────────────
const EMPTY = "__ri_empty__";
const toRadix = (v: string | undefined) => (v == null || v === "" ? EMPTY : v);
const fromRadix = (v: string) => (v === EMPTY ? "" : v);

interface OptData {
	value: string;
	label: ReactNode;
	disabled?: boolean;
}

interface OptionElementProps {
	value?: string;
	disabled?: boolean;
	children?: ReactNode;
}

interface OptGroupElementProps {
	label?: ReactNode;
	children?: ReactNode;
}

/** Flatten <option>/<optgroup> children into structured option data. */
function collectOptions(children: ReactNode): {
	flat: OptData[];
	groups: { label: ReactNode; items: OptData[] }[] | null;
} {
	const flat: OptData[] = [];
	const groups: { label: ReactNode; items: OptData[] }[] = [];
	let hasGroup = false;
	Children.forEach(children, (child) => {
		if (!isValidElement<{ type?: string }>(child)) return;
		const el = child as ReactElement<
			OptionElementProps | OptGroupElementProps
		> & { type: string };
		if (el.type === "optgroup") {
			hasGroup = true;
			const items: OptData[] = [];
			const groupProps = el.props as OptGroupElementProps;
			Children.forEach(groupProps.children, (c) => {
				if (!isValidElement<OptionElementProps>(c)) return;
				const co = c as ReactElement<OptionElementProps> & {
					type: string;
				};
				if (co.type === "option") {
					items.push({
						value: String(co.props.value ?? ""),
						label: co.props.children,
						disabled: co.props.disabled,
					});
				}
			});
			groups.push({ label: groupProps.label, items });
			flat.push(...items);
		} else if (el.type === "option") {
			const props = el.props as OptionElementProps;
			const o: OptData = {
				value: String(props.value ?? ""),
				label: props.children,
				disabled: props.disabled,
			};
			flat.push(o);
			groups.push({ label: null, items: [o] });
		}
	});
	return { flat, groups: hasGroup ? groups : null };
}

interface SelectProps {
	id?: string;
	value?: string;
	onChange?: (e: { target: { value: string } }) => void;
	disabled?: boolean;
	className?: string;
	children?: ReactNode;
	"aria-label"?: string;
	title?: string;
}

const renderItem = (o: OptData, i: number) => (
	<SelectItem
		key={(o.value || EMPTY) + i}
		value={toRadix(o.value)}
		disabled={o.disabled}
	>
		{o.label}
	</SelectItem>
);

export function Select({
	id,
	value,
	onChange,
	disabled,
	className,
	children,
	...rest
}: SelectProps) {
	const { flat, groups } = collectOptions(children);
	const placeholder = flat.find((o) => o.value === "")?.label;
	// De-dupe by radix value (Radix requires unique, non-empty item values).
	const seen = new Set<string>();
	const uniq = flat.filter((o) => {
		const rv = toRadix(o.value);
		if (seen.has(rv)) return false;
		seen.add(rv);
		return true;
	});

	return (
		<UISelect
			value={toRadix(value)}
			onValueChange={(v) =>
				onChange?.({ target: { value: fromRadix(v) } })
			}
			disabled={disabled}
		>
			<SelectTrigger
				id={id}
				className={cn("w-full", className)}
				aria-label={rest["aria-label"]}
				title={rest.title}
			>
				<SelectValue placeholder={placeholder as string | undefined} />
			</SelectTrigger>
			<SelectContent>
				{groups
					? groups.map((g) => {
							const groupKey = `${String(g.label ?? "")}-${g.items[0]?.value ?? ""}`;
							return g.label ? (
								<SelectGroup key={groupKey}>
									<SelectLabel>{g.label}</SelectLabel>
									{g.items.map(renderItem)}
								</SelectGroup>
							) : (
								<Fragment key={groupKey}>
									{g.items.map(renderItem)}
								</Fragment>
							);
						})
					: uniq.map(renderItem)}
			</SelectContent>
		</UISelect>
	);
}

interface FieldProps {
	label?: ReactNode;
	required?: boolean;
	hint?: ReactNode;
	children: ReactNode;
	className?: string;
}

/** Label + control wrapper. */
export function Field({
	label,
	required,
	hint,
	children,
	className,
}: FieldProps) {
	return (
		<div className={className}>
			{label && (
				// biome-ignore lint/a11y/noLabelWithoutControl: generic wrapper renders arbitrary children, so the control's id isn't known here
				<label className="mb-1.5 block font-semibold text-[10px] text-muted-foreground uppercase tracking-widest">
					{label}
					{required && (
						<span className="font-normal text-red-400 normal-case">
							{" "}
							*
						</span>
					)}
				</label>
			)}
			{children}
			{hint && (
				<p className="mt-1.5 text-[10px] text-muted-foreground">
					{hint}
				</p>
			)}
		</div>
	);
}

export function SelectionList({
	title,
	options,
	selected,
	onChange,
}: {
	title: string;
	options: { name: string; detail: string }[];
	selected: string[];
	onChange: (selected: string[]) => void;
}) {
	return (
		<fieldset className="min-w-0">
			<legend className="mb-3 font-semibold text-sm">{title}</legend>
			<div>
				{options.map((option) => (
					<label
						key={option.name}
						className="flex cursor-pointer items-start gap-3 border-b py-4 last:border-0"
					>
						<input
							type="checkbox"
							className="mt-0.5 size-4 shrink-0 accent-primary"
							checked={selected.includes(option.name)}
							onChange={(event) =>
								onChange(
									event.target.checked
										? [...selected, option.name]
										: selected.filter(
												(item) => item !== option.name,
											),
								)
							}
						/>
						<span>
							<strong className="block font-medium text-sm">
								{option.name}
							</strong>
							<span className="mt-1 block text-muted-foreground text-xs">
								{option.detail}
							</span>
						</span>
					</label>
				))}
			</div>
		</fieldset>
	);
}

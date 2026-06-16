import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
	type Block,
	type BlockDef,
	type Paths,
	useBlocks,
} from "@semoss/renderer";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

interface SelectInputSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const FieldSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path: _path,
	}: SelectInputSettingsProps<D>) => {
		const { state } = useBlocks();
		const [expandedId, setExpandedId] = useState<string | null>(null);

		const block = useMemo(() => state.getBlock(id), [state, id]);
		const childrenIds: string[] = block?.slots?.children?.children ?? [];

		if (!block) {
			return (
				<p className="font-normal text-base">No block found for ID</p>
			);
		}

		const parseBoolean = (val: string) =>
			/^(true|1|yes)$/i.test(val.trim());

		const handleTextToggle = (
			childId: string,
			key: "required" | "disabled",
			nextValue: string,
		) => {
			const child = state.getBlock(childId);
			if (!child) {
				console.warn(`Child block not found: ${childId}`);
				return;
			}

			const next = parseBoolean(nextValue);

			if (!child.data || typeof child.data !== "object") {
				child.data = {};
			}

			try {
				child.data[key] = next;
			} catch {
				child.data = { ...(child.data || {}), [key]: next };
			}
		};

		return (
			<div className="mx-auto w-full max-w-[700px]">
				{childrenIds.length === 0 ? (
					<p className="font-normal text-base text-muted-foreground">
						No children found
					</p>
				) : (
					<Accordion
						type="single"
						collapsible
						value={expandedId}
						onValueChange={(val) => setExpandedId(val)}
					>
						{childrenIds.map((childId) => {
							const child = state.getBlock(childId);
							const childData = child?.data || {};
							const requiredStr = String(!!childData.required);
							const disabledStr = String(!!childData.disabled);

							if (!child) {
								return (
									<AccordionItem
										key={childId}
										value={childId}
									>
										<AccordionTrigger>
											<span className="font-bold text-sm uppercase">
												{childId}
											</span>
										</AccordionTrigger>
										<AccordionContent />
									</AccordionItem>
								);
							}

							return (
								<AccordionItem key={childId} value={childId}>
									<AccordionTrigger>
										<span className="text-sm uppercase tracking-wide">
											{childId}
										</span>
									</AccordionTrigger>
									<AccordionContent>
										<div className="flex flex-col gap-1">
											<p className="font-normal text-muted-foreground text-sm">
												Required
											</p>
											<Select
												value={requiredStr}
												onValueChange={(val) => {
													handleTextToggle(
														childId,
														"required",
														val,
													);
												}}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="true">
														True
													</SelectItem>
													<SelectItem value="false">
														False
													</SelectItem>
												</SelectContent>
											</Select>

											<p className="font-normal text-muted-foreground text-sm">
												Disabled
											</p>
											<Select
												value={disabledStr}
												onValueChange={(val) => {
													handleTextToggle(
														childId,
														"disabled",
														val,
													);
												}}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="true">
														True
													</SelectItem>
													<SelectItem value="false">
														False
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</AccordionContent>
								</AccordionItem>
							);
						})}
					</Accordion>
				)}
			</div>
		);
	},
);

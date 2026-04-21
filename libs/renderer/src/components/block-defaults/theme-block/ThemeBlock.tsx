import { observer } from "mobx-react-lite";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef } from "../../../store";
import { Slot } from "../../blocks";

export interface ThemeBlockDef extends BlockDef<"theme"> {
	widget: "theme";
	data: {
		theme: Record<string, unknown>;
	};
	slots: {
		children: true;
	};
}

export const ThemeBlock: BlockComponent = observer(({ id }) => {
	const { attrs, slots } = useBlock<ThemeBlockDef>(id);

	return (
		<div {...attrs}>
			<Slot slot={slots.children} />
		</div>
	);
});

import { observer } from "mobx-react-lite";
import type { Block, BlockDef, Paths } from "@semoss/renderer";
import { BaseSettingSection } from "../BaseSettingSection";
import { DistinctPathButtonGroupButton } from "./DistinctPathButtonGroupButton";

/**
 * Each button in this component points to a distinct path
 * Used when buttons should thematically be grouped together but don't point to the same
 * underlying style path
 */

interface DistinctPathButtonGroupSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label for setting
	 */
	label: string;

	/**
	 * Button options
	 */
	options: Array<{
		value: string;
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		icon: any;
		path: Paths<Block<D>["data"], 4>;
		title: string;
		isDefault: boolean;
	}>;
}

export const DistinctPathButtonGroupSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label,
		options,
	}: DistinctPathButtonGroupSettingsProps<D>) => {
		return (
			<BaseSettingSection label={label}>
				<div className="flex">
					{Array.from(options, (option, i) => {
						return (
							<DistinctPathButtonGroupButton
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								key={i}
								id={id}
								path={option.path}
								styleValue={option.value}
								title={option.title}
								isDefault={option.isDefault}
								ButtonIcon={option.icon}
							/>
						);
					})}
				</div>
			</BaseSettingSection>
		);
	},
);

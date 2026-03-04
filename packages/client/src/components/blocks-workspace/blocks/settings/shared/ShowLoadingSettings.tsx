import { observer } from "mobx-react-lite";
import type { BlockDef } from "@semoss/renderer";
import { Stack } from "@semoss/ui";
import {
	DEFAULT_FALSE_VARIABLE,
	DEFAULT_TRUE_VARIABLE,
} from "../../block-settings/block-defaults.constants";
import { QueryInputSettings } from "../custom";
import { SelectSettings } from "./SelectSettings";

/**
 * Used for any style settings that utilize a size number, ex width and height
 * Supports % and px units for size
 */

interface ShowLoadingSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;
}

export const ShowLoadingSettings = observer(
	<D extends BlockDef = BlockDef>({ id }: ShowLoadingSettingsProps<D>) => {
		return (
			<Stack gap={1}>
				<QueryInputSettings
					id={id}
					label={"Load state"}
					path={"loading"}
					defaultPathMap={{
						...DEFAULT_TRUE_VARIABLE,
						...DEFAULT_FALSE_VARIABLE,
					}}
				/>

				{/* TODO: This should allow me to pass option label and value */}
				<SelectSettings
					id={id}
					label={"Load type"}
					path={"loadType"}
					options={["None (show nothing)", "Skeleton"]}
					multiple={false}
				/>
			</Stack>
		);
	},
);

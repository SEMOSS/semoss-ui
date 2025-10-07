export interface BlockSettingsConfig {
	/** Block type: BLOCK_TYPE_ACTION | BLOCK_TYPE_CHART | BLOCK_TYPE_DISPLAY | BLOCK_TYPE_INPUT | BLOCK_TYPE_LAYOUT | BLOCK_TYPE_DATA */
	type: string;

	/** Icon to render in the builder sidebar */
	icon: React.FunctionComponent;

	/** *new* custom menu */
	menu?: (props: {
		/** Id of the block */
		id: string;
	}) => JSX.Element;

	/** Content Menu */
	contentMenu?: {
		name: string;
		children: {
			/** Description for the setting */
			description: string;
			/** Render the setting */
			render: (props: {
				/** Id of the block */
				id: string;
			}) => JSX.Element;
		}[];
	}[];

	/** Style Menu */
	styleMenu?: {
		name: string;
		children: {
			/** Description for the setting */
			description: string;
			/** Render the setting */
			render: (props: {
				/** Id of the block */
				id: string;
			}) => JSX.Element;
		}[];
	}[];
}

import { CSSProperties, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { InputSettings, QuerySelectionSettings } from '../../settings';
import { buildListener, buildShowField } from '../block-defaults.shared';
import { FormatShapes } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { SelectInputSettings } from '../../settings/shared/SelectInputSettings';
import { InputModalSettings } from '../../settings/shared/InputModalSettings';
import { SwitchSettings } from '../../settings/shared/SwitchSettings';
import { BlockSettingsConfig } from '../settings.types';
import { useBlockSettings } from '@/hooks';

export const DefaultStyles: CSSProperties = {
	width: "100%",
	padding: "4px",
};

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_INPUT,
	icon: FormatShapes,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Input Type",
					render: ({ id }) => {
						return (
							<SelectInputSettings
								id={id}
								path="type"
								label="Type"
								options={[
									{
										value: "text",
										display: "Text",
									},
									{
										value: "number",
										display: "Number",
									},
									{
										value: "date",
										display: "Date",
									},
									{
										value: "datetime",
										display: "DateTime",
									},
								]}
							/>
						);
					},
				},
                {
                    description: 'Date Format Options',
                    render: observer(({ id }) => {
                        const { data } = useBlockSettings(id);
                        
                        // Only show when Date is selected
                        if (data.type !== 'date') {
                            return null;
                        }

                        return (
                            <div style={{
                                marginLeft: '16px',
                                paddingLeft: '12px',
                                borderLeft: '3px solid #e0e0e0',
                                backgroundColor: '#fafafa',
                                borderRadius: '4px',
                            }}>
                                <SelectInputSettings
                                    id={id}
                                    path="dateFormat"
                                    label="📅 Choose Date Format"
                                    options={[
                                        {
                                            value: 'mm//dd/yyyy',
                                            display: '📅 mm//dd/yyyy (Date Picker)',
                                        },
                                        {
                                            value: 'YYYY-MM-DDTHH:mm:ssZ',
                                            display: '🕒 YYYY-MM-DDTHH:mm:ssZ (DateTime Picker)',
                                        },
                                        {
                                            value: 'YYYYMMDDTHHmmss[Z]',
                                            display: '🕒 YYYYMMDDTHHmmss[Z] (DateTime Picker)',
                                        },
                                    ]}
                                />
                            </div>
                        );
                    }),
                },
				{
					description: "Label",
					render: ({ id }) => (
						<InputSettings id={id} label="Label" path="label" />
					),
				},
				{
					description: "Hint",
					render: ({ id }) => (
						<InputSettings id={id} label="Hint" path="hint" />
					),
				},
				{
                    description: "Value",
                    render: observer(({ id }) => {
                        const { data } = useBlockSettings(id);
                        
                        // Use SwitchSettings for boolean type, InputModalSettings for others
                        if (data.type === "boolean") {
                            return (
                                <SwitchSettings
                                    id={id}
                                    label="Value"
                                    path="value"
                                />
                            );
                        }
                        
                        // Use InputModalSettings for all other types
                        return (
                            <InputModalSettings
                                id={id}
                                label="Value"
                                path="value"
                            />
                        );
                    }),
                },
				{
					description: "Loading",
					render: ({ id }) => (
						<QuerySelectionSettings
							id={id}
							label="Loading"
							path="loading"
							queryPath="isLoading"
						/>
					),
				},
				{
					description: "Disabled",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Disabled"
							path="disabled"
						/>
					),
				},
				{
					description: "Required",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Required"
							path="required"
						/>
					),
				},
			],
		},
		{
			name: "Conditional",
			children: [...buildShowField()],
		},
		{
			name: "Pre Process",
			children: [...buildListener("preProcess")],
		},
		{
			name: "On Change",
			children: [...buildListener("onChange")],
		},
	],
	styleMenu: [
		{
			name: "Miscellaneous",
			children: [
				{
					description: "Rows",
					render: ({ id }) => (
						<InputSettings
							id={id}
							label="Rows"
							path="rows"
							type="number"
							description="This will determine how many rows are displayed on text input"
						/>
					),
				},
			],
		},
	],
};

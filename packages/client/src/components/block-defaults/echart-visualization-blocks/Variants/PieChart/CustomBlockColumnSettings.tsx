import { observer } from 'mobx-react-lite';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import {
    Autocomplete,
    IconButton,
    List,
    Select,
    styled,
    TextField,
    useNotification,
} from '@semoss/ui';
import {
    useBlockSettings,
    useBlocksPixel,
    useFrame,
    useFrameHeaders,
} from '@/hooks';
import { BaseSettingSection } from '@/components/block-settings';
import { Sync } from '@mui/icons-material';
import { GridBlockColumn } from '../../../grid-block/grid-block.types';
import { Stack } from '@mui/material';
import { EchartVisualizationBlockDef } from './echartblocks';
import { PathValue } from '@/types';
import { useEffect } from 'react';

interface GridBlockColumnSettingsProps {
    /** Id of the block */
    id: string;
    /** Frame that the user is interacting with */
    frame: ReturnType<typeof useFrame>;
}
const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));

export const CustomBlockColumnSettings = observer(
    ({ id, frame }: GridBlockColumnSettingsProps) => {
        debugger;
        const notification = useNotification();
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        useEffect(() => {
            try {
                const LableData: [] = [];
                const ValueData: [] = [];
                let valueIndex = data.frame.valueIndex;
                let labelIndex = data.frame.labelIndex;
                frame1.data.values.forEach((item: []) => {
                    ValueData.push(item[valueIndex]),
                        setData('frame.values', ValueData);
                });
                frame1.data.values.forEach((item: []) => {
                    LableData.push(item[labelIndex]),
                        setData('frame.labels', LableData);
                });
                let labels = data.frame.labels;
                let values = data.frame.values;
                const Data = values.map((value, index) => ({
                    value: value,
                    name: labels[index],
                }));
                data.option['series'][0].data = Data;
                setData('option', data.option as PathValue<any, any>);
            } catch {}
        });

        // get all of the frames
        const getFrames = useBlocksPixel<string[]>('GetFrames();', {
            data: [],
        });
        const frame1 = useFrame(data.frame?.name, {
            selector: 'QueryAll()',
            offset: 0,
            limit: 10,
            enableCount: true,
        });
        const frameHeaders = useFrameHeaders(data.frame?.name);
        const syncFrameHeaders = () => {
            let labels = data.frame.labels;
            let values = data.frame.values;
            const Data = values.map((value, index) => ({
                value: value,
                name: labels[index],
            }));
            data.option['series'][0].data = Data;
            setData('option', data.option as PathValue<any, any>);
            try {
                notification.add({
                    color: 'success',
                    message: 'Succesfully synchronized headers',
                });
            } catch (e) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            }
        };

        const columnMap: Record<string, GridBlockColumn> = {};
        // get the frameHeaders as columns
        const columns = frameHeaders.data.list.map((h) => {
            return {
                name: h.alias,
                width: undefined,
                // add the previous if it exists
                ...JSON.parse(JSON.stringify(columnMap[h.alias] || {})),
                selector: h.header,
            };
        });

        // update the data
        setData('columns', columns);

        // options for the autocomplete
        const options = getFrames.status === 'SUCCESS' ? getFrames.data : [];

        function updateValue(e) {
            const value = e.target.value;
            const index = frameHeaders.data.list.findIndex(
                (item) => item.alias === value,
            );
            setData('frame.valueIndex', index);
            const Data: [] = [];
            frame1.data.values.forEach((item: []) => {
                Data.push(item[index]), setData('frame.values', Data);
            });
        }
        function updateLabel(e) {
            const value = e.target.value;
            const index = frameHeaders.data.list.findIndex(
                (item) => item.alias === value,
            );
            setData('frame.labelIndex', index);
            let Labels: [] = [];
            frame1.data.values.forEach((item: []) => {
                Labels.push(item[index]), setData('frame.labels', Labels);
            });
        }

        return (
            <>
                <BaseSettingSection label="Frame">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={getFrames.status !== 'SUCCESS'}
                        // value={data.frame.name}
                        options={options}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // update the frame
                            setData('frame.name', value);
                        }}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select frame"
                                size="small"
                                variant="outlined"
                            />
                        )}
                    />

                    <IconButton size="small" onClick={syncFrameHeaders}>
                        <Sync />
                    </IconButton>
                </BaseSettingSection>
                {data.frame?.name !== '' && (
                    <Stack
                        direction={'column'}
                        width={'100%'}
                        overflow={'hidden'}
                    >
                        <div>
                            <label
                                style={{
                                    paddingTop: '0.5rem',
                                }}
                                htmlFor="label-position"
                            >
                                Choose Label
                            </label>
                            <StyledSelect
                                id="label-position"
                                label="Select value"
                                name="labelPosition"
                                onChange={updateLabel}
                            >
                                <Select.Item key="-1" value="">
                                    Select
                                </Select.Item>
                                {frameHeaders.data.list.map((label, index) => {
                                    return (
                                        <Select.Item
                                            value={label.alias}
                                            key={index}
                                        >
                                            {label.alias}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </div>
                        <div>
                            <label
                                style={{
                                    paddingTop: '0.5rem',
                                }}
                                htmlFor="label-position"
                            >
                                Choose Value
                            </label>
                            <StyledSelect
                                id="label-position"
                                label="Select value"
                                name="labelPosition"
                                onChange={updateValue}
                            >
                                <Select.Item key="-1" value="">
                                    Select
                                </Select.Item>
                                {frameHeaders.data.list.map((label, index) => {
                                    return (
                                        <Select.Item
                                            value={label.alias}
                                            key={index}
                                        >
                                            {label.alias}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </div>
                    </Stack>
                )}
            </>
        );
    },
);

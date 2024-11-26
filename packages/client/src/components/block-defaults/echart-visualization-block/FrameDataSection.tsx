import { BaseSettingSection } from '@/components/block-settings';
import { useBlockSettings, useBlocksPixel, useFrameHeaders } from '@/hooks';
import {
    Autocomplete,
    IconButton,
    List,
    Stack,
    TextField,
    useNotification,
} from '@semoss/ui';
import {
    EChartVisualizationBlockDef,
    EChartColumns,
} from './EChartVisualizationBlock';
import { Sync } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Delete } from '@mui/icons-material';

export const FrameDataSection = ({ id }) => {
    const { data, setData } = useBlockSettings<EChartVisualizationBlockDef>(id);
    const notification = useNotification();
    // get all of the frames
    const getFrames = useBlocksPixel<string[]>('GetFrames();', {
        data: [],
    });
    // get headers associated with the selected frames
    const frameHeaders = useFrameHeaders(data.frame?.name);
    console.log(frameHeaders, data);
    /**
     * Sync the columns with the frame headers
     */
    const syncFrameHeaders = () => {
        try {
            // get the columns by selector
            // const columnMap: Record<string, EChartColumns> =
            //     data.columns.reduce((acc, val) => {
            //         acc[val.name] = acc;

            //         return acc;
            //     }, {});
            const columnMap: Record<string, EChartColumns> = {};

            // get the frameHeaders as columns
            const columns: EChartColumns[] = frameHeaders.data.list.map((h) => {
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

    // options for the autocomplete
    const options = getFrames.status === 'SUCCESS' ? getFrames.data : [];
    // Columns to render
    const columns = data.columns || [];

    const reorderColumns = (startDragIndex: number, stopDragIndex: number) => {
        // get the columns
        const columns = [...data.columns];

        // remove it
        const [removed] = columns.splice(startDragIndex, 1);

        // add it at the new location
        columns.splice(stopDragIndex, 0, removed);

        // update the data
        setData('columns', columns);
    };

    return (
        <>
            <BaseSettingSection label="Frame">
                <Autocomplete
                    fullWidth
                    multiple={false}
                    disabled={getFrames.status !== 'SUCCESS'}
                    value={data.frame?.name}
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

                <IconButton size="small" onClick={() => syncFrameHeaders()}>
                    <Sync />
                </IconButton>
            </BaseSettingSection>
            <Stack direction={'column'} width={'100%'} overflow={'hjdden'}>
                <DragDropContext
                    onDragEnd={(result) => {
                        // ingnore if no destination
                        if (!result.destination) {
                            return;
                        }

                        // swap
                        reorderColumns(
                            result.source.index,
                            result.destination.index,
                        );
                    }}
                >
                    <Droppable droppableId="droppable">
                        {(provided) => (
                            <List
                                sx={{
                                    width: '100%',
                                }}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {data?.columns?.map((c, cIdx) => {
                                    return (
                                        <Draggable
                                            draggableId={`grid-column--${cIdx}`}
                                            index={cIdx}
                                        >
                                            {(provided, snapshot) => (
                                                <List.Item
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    dense={true}
                                                    divider
                                                    secondaryAction={
                                                        <>
                                                            <IconButton
                                                                disabled={
                                                                    snapshot.isDragging
                                                                }
                                                                size="small"
                                                                onClick={() => {
                                                                    // get the columns except the current one
                                                                    console.log(
                                                                        data.columns,
                                                                        'before change',
                                                                    );
                                                                    const columns =
                                                                        data.columns.filter(
                                                                            (
                                                                                v,
                                                                                idx,
                                                                            ) =>
                                                                                cIdx !==
                                                                                idx,
                                                                        );
                                                                    console.log(
                                                                        columns,
                                                                    );
                                                                    // update the data
                                                                    setData(
                                                                        'columns',
                                                                        columns,
                                                                    );
                                                                }}
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        </>
                                                    }
                                                >
                                                    <List.ItemText
                                                        primary={c.name}
                                                        secondary={c.selector}
                                                        primaryTypographyProps={{
                                                            title: c.name,
                                                            style: {
                                                                whiteSpace:
                                                                    'nowrap',
                                                                overflow:
                                                                    'hidden',
                                                                textOverflow:
                                                                    'ellipsis',
                                                            },
                                                        }}
                                                        secondaryTypographyProps={{
                                                            title: c.selector,
                                                            style: {
                                                                whiteSpace:
                                                                    'nowrap',
                                                                overflow:
                                                                    'hidden',
                                                                textOverflow:
                                                                    'ellipsis',
                                                            },
                                                        }}
                                                    />
                                                </List.Item>
                                            )}
                                        </Draggable>
                                    );
                                })}
                            </List>
                        )}
                    </Droppable>
                </DragDropContext>
            </Stack>
        </>
    );
};

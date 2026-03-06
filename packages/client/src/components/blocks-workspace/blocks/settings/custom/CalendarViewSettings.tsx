import { observer } from 'mobx-react-lite';
import { Stack, Typography, Button } from '@semoss/ui';
import { Add } from '@mui/icons-material';
import { useBlockSettings } from '@/hooks';
import { useBlocks, ActionMessages } from '@semoss/renderer';

interface CalendarViewSettingsProps {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    
    /**
     * Settings label
     */
    label: string;
    
    /**
     * Path to the specific calendar settings
     */
    path?: string;
}

/**
 * CalendarViewSettings component for additional calendar-specific configurations
 * Currently provides basic settings. The main data source is handled by QueryInputSettings
 * in the block-settings config.
 */
export const CalendarViewSettings = observer(
    ({ id, label }: CalendarViewSettingsProps) => {
        const { data, setData } = useBlockSettings(id);
        const { state } = useBlocks();

        // Function to add child component to calendar block
        const handleAddChildComponent = () => {
            state.dispatch({
                message: ActionMessages.ADD_BLOCK,
                payload: {
                    json: {
                        widget: 'container',
                        data: {
                            style: {
                                padding: '16px',
                                border: '1px dashed #ccc',
                                borderRadius: '4px',
                                minHeight: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            },
                        },
                        listeners: {},
                        slots: {},
                    },
                    position: {
                        parent: id,
                        slot: 'children',
                    },
                },
            });
        };

        return (
            <Stack spacing={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {label}
                </Typography>
                
                {/* Add Child Components Section */}
                <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddChildComponent}
                    fullWidth
                    size="small"
                    sx={{
                        borderStyle: 'dashed',
                        borderColor: 'primary.main',
                        '&:hover': {
                            borderStyle: 'dashed',
                            backgroundColor: 'primary.50',
                        },
                    }}
                >
                    Add Content Component
                </Button>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Add components that will be displayed on calendar dates with events
                </Typography>
            </Stack>
        );
    }
);

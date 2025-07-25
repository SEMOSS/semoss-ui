import { Stack, styled, TextArea, TextField, Typography } from '@semoss/ui';
import { PythonConfigValues } from './engine.types';

interface PythonConfigurationProps {
    value: PythonConfigValues;
    onChange: (newValues: PythonConfigValues) => void;
}

const StyledDiv = styled('div')(() => ({
    display: 'flex',
    width: '100%',
    gap: '25px',
}));

export const PythonConfiguration = ({
    value,
    onChange,
}: PythonConfigurationProps) => {
    const handleChange = (field: keyof PythonConfigValues, val: string) => {
        onChange({ ...value, [field]: val });
    };
    return (
        <form>
            <StyledDiv>
                <Stack>
                    <Typography variant="h2">General</Typography>
                    <Typography variant="body1" color={'secondary'}>
                        Please provide the name, type, and model to uniquely
                        identify, categorize, and configure your setup for
                        optimal performance.
                    </Typography>
                </Stack>
                <StyledDiv>
                    <div style={{ width: '100%', marginTop: '5px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <TextField
                                sx={{ borderRadius: '8px' }}
                                size="small"
                                fullWidth
                                placeholder="Function Type *"
                                value={value.FUNCTION_TYPE}
                                onChange={(e) =>
                                    handleChange(
                                        'FUNCTION_TYPE',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <TextField
                                sx={{ borderRadius: '8px' }}
                                size="small"
                                fullWidth
                                placeholder="Function Name *"
                                value={value.NAME}
                                onChange={(e) =>
                                    handleChange('NAME', e.target.value)
                                }
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <TextField
                                sx={{ borderRadius: '8px' }}
                                size="small"
                                fullWidth
                                placeholder="Function Parameters *"
                                value={value.FUNCTION_PARAMETERS}
                                onChange={(e) =>
                                    handleChange(
                                        'FUNCTION_PARAMETERS',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <TextField
                                sx={{ borderRadius: '8px' }}
                                size="small"
                                fullWidth
                                placeholder="Function Required Parameters *"
                                value={value.FUNCTION_REQUIRED_PARAMETERS}
                                onChange={(e) =>
                                    handleChange(
                                        'FUNCTION_REQUIRED_PARAMETERS',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <TextArea
                                sx={{ borderRadius: '8px' }}
                                fullWidth
                                placeholder="Description *"
                                minRows={4}
                                maxRows={10}
                                value={value.FUNCTION_DESCRIPTION}
                                onChange={(e) =>
                                    handleChange(
                                        'FUNCTION_DESCRIPTION',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <TextField
                                sx={{ borderRadius: '8px' }}
                                size="small"
                                fullWidth
                                placeholder="Python File Name *"
                                value={value.PYTHON_FILE_NAME}
                                onChange={(e) =>
                                    handleChange(
                                        'PYTHON_FILE_NAME',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <TextArea
                                sx={{ borderRadius: '8px' }}
                                fullWidth
                                placeholder="Content *"
                                minRows={4}
                                maxRows={10}
                                value={value.CONTENT}
                                onChange={(e) =>
                                    handleChange('CONTENT', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </StyledDiv>
            </StyledDiv>
        </form>
    );
};

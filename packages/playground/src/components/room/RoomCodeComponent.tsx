import { observer } from 'mobx-react-lite';
import { ChatRoom } from '@/stores';
import {
    styled,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    IconButton,
    TextField,
    MenuItem,
} from '@mui/material';
import { FileEditor, FileRenderer, RightMenu } from '@/components/common';
import { useState } from 'react';
import { Close } from '@mui/icons-material';

const StyledContainer = styled(Stack)(({ theme }) => ({
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
}));

const StyledContent = styled(Stack)(({ theme }) => ({
    position: 'relative',
    flex: 1,
    width: '100%',
    height: '100%',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
}));

interface RoomCodeComponentProps {
    /** Room to view the messages for */
    room: ChatRoom;
}

export const RoomCodeComponent: React.FC<RoomCodeComponentProps> = observer(
    (props) => {
        const { room } = props;

        // track the modified (rendered) content
        const [artifact, setArtifact] = useState<{
            name: string;
            content: string;
        } | null>(() => {
            if (
                room.sidebar.options.type === 'CODE' &&
                room.artifacts[room.sidebar.options.name]
            ) {
                return room.artifacts[room.sidebar.options.name];
            }

            return null;
        });
        const [view, setView] = useState<'preview' | 'code'>('preview');

        return (
            <RightMenu
                mode="fixed"
                onClose={() => room.closeSidebar()}
                header={
                    <>
                        <Stack alignItems={'center'} flex={1}>
                            <TextField
                                placeholder="Select Artifact"
                                color="secondary"
                                variant={'outlined'}
                                size="small"
                                select
                                value={artifact?.name}
                                fullWidth={true}
                                onChange={(e) => {
                                    setArtifact(
                                        room.artifacts[e.target.value] || null,
                                    );
                                }}
                            >
                                {room.artifactsList.map((a) => {
                                    return (
                                        <MenuItem key={a.name} value={a.name}>
                                            {a.name}
                                        </MenuItem>
                                    );
                                })}
                            </TextField>
                        </Stack>
                        {artifact && (
                            <ToggleButtonGroup
                                size="small"
                                color="secondary"
                                value={view}
                                exclusive
                                onChange={(e, v) => setView(v)}
                                aria-label="Code Toggle"
                            >
                                <ToggleButton
                                    size="small"
                                    value="preview"
                                    disabled
                                >
                                    Preview
                                </ToggleButton>
                                <ToggleButton size="small" value="code">
                                    Code
                                </ToggleButton>
                            </ToggleButtonGroup>
                        )}
                    </>
                }
            >
                {artifact ? (
                    <>
                        {view === 'preview' && (
                            <FileRenderer
                                name={artifact.name}
                                value={artifact.content}
                            />
                        )}
                        {view === 'code' && (
                            <FileEditor
                                name={artifact.name}
                                value={artifact.content}
                                onChange={(v) =>
                                    setArtifact({
                                        ...artifact,
                                        content: v,
                                    })
                                }
                            />
                        )}
                    </>
                ) : (
                    <Stack
                        height={'100%'}
                        width={'100%'}
                        alignItems={'center'}
                        justifyContent={'center'}
                    >
                        <Typography variant="caption">
                            Select an Artifact
                        </Typography>
                    </Stack>
                )}
            </RightMenu>
        );
    },
);

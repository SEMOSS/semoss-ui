import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Stack,
    Link,
    Modal,
    RadioGroup,
    TextArea,
    styled,
    Card,
    Avatar,
    Icon,
} from '@semoss/ui';
import { modelledDependency } from '@/components/app';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import { Edit, EditRounded, RemoveRedEyeRounded } from '@mui/icons-material';
import OPEN_AI from '@/assets/img/OPEN_AI.png';
import { useRootStore } from '@/hooks';
import { PERMISSION_DESCRIPTION_MAP } from '@/constants';
import { EngineAccessButton } from '@/components/engine';
import { EngineContext } from '@/contexts/EngineContext';
import { ENGINE_TYPES, Role } from '@/types';

const StyledCard = styled(Card)({ borderRadius: '12px' });

const PERMISSION_ICONS = {
    OWNER: (
        <PersonIcon
            fontSize="small"
            sx={{ color: '#C4C4C4', width: 16, height: 16 }}
        />
    ),
    READ_ONLY: (
        <VisibilityIcon
            fontSize="small"
            sx={{ color: '#C4C4C4', width: 16, height: 16 }}
        />
    ),
    EDIT: (
        <Edit
            fontSize="small"
            sx={{ color: '#C4C4C4', width: 16, height: 16 }}
        />
    ),
    NONE: (
        <BlockIcon
            fontSize="small"
            sx={{ color: '#C4C4C4', width: 16, height: 16 }}
        />
    ),
};

export const Dependencies = ({
    dependencies,
}: {
    dependencies: modelledDependency[];
}) => {
    const toCapitalized = (word: string): string => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    };

    return (
        <Stack spacing={2} sx={{ width: '100%', p: 2 }}>
            {dependencies.map((dep, idx) => {
                const permissionKey = dep.userPermission || 'NONE';

                return (
                    <Box
                        key={idx}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            p: 2,
                            border: '1px solid #ddd',
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            width: '100%',
                        }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <img
                                    src={OPEN_AI}
                                    alt={dep.name}
                                    width={48}
                                    height={48}
                                />
                                <Box>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            color: 'primary.main',
                                            fontSize: 16,
                                        }}
                                    >
                                        <Link
                                            href={`./#/engine/${dep.type}/${dep.id}`}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{ ml: '0.5px' }}
                                            >
                                                {dep.name}
                                            </Typography>
                                        </Link>
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {PERMISSION_ICONS[permissionKey]}
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontSize: 12,
                                                ml: '0.5px',
                                                color: 'text.secondary',
                                            }}
                                        >
                                            {toCapitalized(
                                                dep.userPermission || 'NONE',
                                            )}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        ml: 'auto',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                    }}
                                >
                                    <Stack direction="row" spacing={1}>
                                        {dep.isPublic && (
                                            <Chip label="Public" />
                                        )}
                                        {!dep.isPublic &&
                                            dep.isDiscoverable && (
                                                <Chip label="Discoverable" />
                                            )}
                                        {!dep.isPublic &&
                                            !dep.isDiscoverable && (
                                                <>
                                                    <Chip label="Non-Discoverable" />
                                                    <Chip label="Private" />
                                                </>
                                            )}
                                        <Chip label={toCapitalized(dep.type)} />
                                    </Stack>
                                    <EngineContext.Provider
                                        value={{
                                            type: dep.type as ENGINE_TYPES,
                                            id: dep.id,
                                            name: dep.name,
                                            role: dep.userPermission as Role,
                                            refresh: () => {
                                                // Refresh function
                                            },
                                            metaVals: {},
                                            llmModels: [],
                                        }}
                                    >
                                        <EngineAccessButton fromApp={true} />
                                    </EngineContext.Provider>
                                </Stack>
                            </Box>

                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary' }}
                            >
                                {dep.description &&
                                dep.description.trim() !== ''
                                    ? dep.description
                                    : 'No Description Available'}
                            </Typography>
                        </Box>
                    </Box>
                );
            })}
        </Stack>
    );
};

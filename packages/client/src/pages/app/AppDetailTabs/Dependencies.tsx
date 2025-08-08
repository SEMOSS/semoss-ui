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
import { Edit } from '@mui/icons-material';
import OPEN_AI from '@/assets/img/OPEN_AI.png';
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

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "12px",
  bgcolor: "background.paper",
  width: "100%",
}));

const StyledOutline = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "16px",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
   color: 'primary.main',
   fontSize: 16,
}));

const StyledIcons = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

const StyledStatus = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  marginLeft: "0.5px",
  color: "text.secondary",
}));

const StyledStack = styled(Stack)(({ theme }) => ({
  marginLeft: "8px",
  justifyContent: "space-between",
  width: "100%",
}));



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
                    <StyledContainer
                        key={idx}
                    >
                        <Box sx={{ flex: 1 }}>
                            <StyledOutline>
                                <img
                                    src={OPEN_AI}
                                    alt={dep.name}
                                    width={48}
                                    height={48}
                                />
                                <Box>
                                    <StyledTypography
                                        variant="subtitle1"
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
                                    </StyledTypography>
                                    <StyledIcons>
                                        {PERMISSION_ICONS[permissionKey]}
                                        <StyledStatus
                                            variant="subtitle1"
                                        >
                                            {toCapitalized(
                                                dep.userPermission || 'NONE',
                                            )}
                                        </StyledStatus>
                                    </StyledIcons>
                                </Box>
                                <StyledStack
                                    direction="row"
                                    spacing={1}
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
                                            name: dep.name,
                                            path: '', // Provide the correct path if available
                                            active: {
                                                id: dep.id,
                                                role: dep.userPermission as Role,
                                                name: dep.name,
                                                metadata: {},
                                                refresh: () => {
                                                    // no-op
                                                },
                                            },
                                        }}
                                    >
                                        <EngineAccessButton fromApp={true} />
                                    </EngineContext.Provider>
                                </StyledStack>
                            </StyledOutline>

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
                    </StyledContainer>
                );
            })}
        </Stack>
    );
};

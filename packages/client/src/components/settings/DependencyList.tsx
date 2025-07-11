import React, { useEffect } from 'react';
import { styled, Typography } from '@semoss/ui';
import { usePixel } from '@/hooks';

interface DependencyListProps {
    id: string;
}

// Interface for API response
interface EngineData {
    engine_id: string;
    engine_name: string;
    engine_type: string;
    engine_subtype: string;
    engine_date_created: string;
    engine_discoverable: boolean;
    engine_global: boolean;
}

const StyledUuidItem = styled('div')(({ theme }) => ({
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const StyledUuidList = styled('div')({
    width: '100%',
    maxHeight: '500px',
    overflowY: 'auto',
});

export const DependencyList = ({ id }: DependencyListProps) => {
    const getProjectDependencies = usePixel<EngineData[]>(
        `GetProjectDependencies(project="${id}", details=[true]);`,
    );

    const handleEngineClick = (engineId: string) => {
        const baseUrl = `${window.location.protocol}//${window.location.host}`;
        const safeEngineId = encodeURIComponent(engineId);
        const url = `${baseUrl}/SemossWeb/packages/client/dist/#/engine/storage/${safeEngineId}`;
        window.open(url, '_blank');
    };

    return (
        <div style={{ width: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Dependencies
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
                The following resources are associated with this application:
            </Typography>

            <StyledUuidList>
                {getProjectDependencies.status === 'SUCCESS' &&
                Array.isArray(getProjectDependencies.data) &&
                getProjectDependencies.data.length > 0 ? (
                    getProjectDependencies.data.map(
                        (dependency: EngineData, index: number) => (
                            <StyledUuidItem
                                key={dependency.engine_id || index}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                    handleEngineClick(dependency.engine_id)
                                }
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter')
                                        handleEngineClick(dependency.engine_id);
                                }}
                            >
                                <div>
                                    <Typography
                                        variant="subtitle2"
                                        color="primary"
                                    >
                                        {dependency.engine_name} (
                                        {dependency.engine_type})
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="secondary"
                                    >
                                        ID: {dependency.engine_id}
                                    </Typography>
                                </div>
                            </StyledUuidItem>
                        ),
                    )
                ) : getProjectDependencies.status === 'LOADING' ? (
                    <Typography variant="body2" color="secondary">
                        Loading dependencies...
                    </Typography>
                ) : getProjectDependencies.status === 'ERROR' ? (
                    <Typography variant="body2" color="error">
                        Error loading dependencies. Check console for details.
                    </Typography>
                ) : (
                    <Typography variant="body2" color="secondary">
                        No dependencies found for this application.
                    </Typography>
                )}
            </StyledUuidList>
        </div>
    );
};

import { useEffect, useState } from 'react';

import { styled, theme, Select, Icon } from '@semoss/components';
import { mdiClipboardTextOutline } from '@mdi/js';

import { useRootStore, useAPI, useSettings } from '../hooks';
import { LoadingScreen } from '@/components/ui';
import { Permissions } from '@/components/database';

const StyledContainer = styled('div', {
    margin: '0 auto',
    paddingLeft: theme.space[8],
    paddingRight: theme.space[8],
    paddingBottom: theme.space[8],
    '@sm': {
        maxWidth: '640px',
    },
    '@md': {
        maxWidth: '768px',
    },
    '@lg': {
        maxWidth: '1024px',
    },
    '@xl': {
        maxWidth: '1280px',
    },
    '@xxl': {
        maxWidth: '1536px',
    },
});

const StyledDescription = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.sm,
    width: '100%',
    maxWidth: '50%',
    marginBottom: theme.space['6'],
});

const StyledLoadWorkflowContainer = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors['grey-2'],
    backgroundColor: theme.colors.base,
    marginTop: theme.space[4],
    border: `${theme.borderWidths.default} solid ${theme.colors['grey-4']}`,
    '@sm': {
        minHeight: '5rem',
    },
    '@md': {
        minHeight: '8rem',
    },
    '@lg': {
        minHeight: '10rem',
    },
    '@xl': {
        minHeight: '15rem',
    },
    '@xxl': {
        minHeight: '30rem',
    },
});

const StyledIcon = styled(Icon, {
    fontSize: '4rem',
});

const StyledDiv = styled('div', {
    display: 'flex',
    // border: 'solid',
});

const StyledChangeProject = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.md,
    width: '100%',
    maxWidth: '50%',
    marginBottom: theme.space['6'],
    // border: 'solid',
});

export interface ProjectInterface {
    project_global: boolean;
    project_id: string;
    project_name: string;
    project_permission: string;
    project_visibility: boolean;
}

export const ProjectPermissionsPage = () => {
    const { monolithStore } = useRootStore();
    const { adminMode } = useSettings();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] =
        useState<ProjectInterface>(null);

    const getProjects = useAPI(['getProjects', adminMode]);

    useEffect(() => {
        setSelectedProject(null);
    }, [projects]);

    useEffect(() => {
        // REST call to get all apps
        if (getProjects.status !== 'SUCCESS' || !getProjects.data) {
            return;
        }

        setProjects(getProjects.data);

        () => {
            console.warn('Cleaning up getProjects');
            setProjects([]);
        };
    }, [getProjects.status, getProjects.data]);

    // show a loading screen when getProjects is pending
    if (getProjects.status !== 'SUCCESS') {
        return (
            <LoadingScreen.Trigger description="Retrieving project folders" />
        );
    }

    /**
     * @name getDisplay
     * @desc gets display options for the DB dropdown
     * @param option - the object that is specified for the option
     */
    const getDisplay = (option) => {
        return `${formatProjectName(option.project_name)} - ${
            option.project_id
        }`;
    };

    const formatProjectName = (str) => {
        let i;
        const frags = str.split('_');
        for (i = 0; i < frags.length; i++) {
            frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
        }
        return frags.join(' ');
    };

    return (
        <StyledContainer>
            <>
                <StyledDescription>
                    View and edit settings for projects
                </StyledDescription>
                <div>
                    <Select
                        value={selectedProject}
                        defaultValue={selectedProject}
                        options={projects}
                        getDisplay={getDisplay}
                        onChange={(opt) => {
                            // Set selected proj
                            setSelectedProject(opt);
                        }}
                        placeholder="Select an option to view project specific settings"
                    ></Select>
                    {selectedProject ? (
                        <>
                            <Permissions
                                config={{
                                    id: selectedProject.project_id,
                                    name: selectedProject.project_name,
                                    global: selectedProject.project_global,
                                    visibility:
                                        selectedProject.project_visibility,
                                }}
                            ></Permissions>
                        </>
                    ) : (
                        <StyledLoadWorkflowContainer>
                            <StyledIcon
                                size="xl"
                                path={mdiClipboardTextOutline}
                            ></StyledIcon>
                            <p>SEMOSS is waiting on your selection</p>
                        </StyledLoadWorkflowContainer>
                    )}
                </div>
            </>
        </StyledContainer>
    );
};

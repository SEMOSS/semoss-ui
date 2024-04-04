import { styled, Stack, Typography, Card, Button, Chip } from '@semoss/ui';
import { Person, QueryBuilder } from '@mui/icons-material';
import { DEFAULT_TEMPLATE, Template } from '@/stores';
import { AppMetadata } from './app.types';
import { AppTileCard } from './AppTileCard';

// const StyledFilter = styled('div')(({ theme }) => ({
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'flex-start',
//     height: 'fit-content',
//     width: '352px',
//     paddingBottom: theme.spacing(2.75),
//     boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
//     background: theme.palette.background.paper,
// }));

// const StyledFilterList = styled(List)(({ theme }) => ({
//     width: '100%',
//     borderRadius: theme.shape.borderRadius,
//     gap: theme.spacing(2),
// }));

const StyledCard = styled(Card)(({ theme }) => ({
    width: '240px',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    gap: theme.spacing(1.5),
}));

const StyledDescription = styled(Typography)(() => ({
    height: '60px', // 3 * line height
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: '3',
    WebkitBoxOrient: 'vertical',
}));

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
}));

const StyledChipContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    height: theme.spacing(4),
}));

interface AppTemplatesProps {
    /** Use a template */
    onUse: (template: Template) => void;
}

export const AppTemplates = (props: AppTemplatesProps) => {
    const { onUse = () => null } = props;

    const getAppMetadataFromTemplate = (template: Template): AppMetadata => {
        return {
            project_id: template.name,
            project_name: template.name,
            project_type: 'BLOCKS',
            project_cost: '',
            project_global: '',
            project_catalog_name: '',
            project_created_by: 'SYSTEM',
            project_created_by_type: '',
            project_date_created: '',
            project_has_portal: false,
            tag: template.tags,
            description: template.description,
        };
    };

    return (
        <Stack
            direction={'row'}
            alignItems={'flex-start'}
            alignSelf={'stretch'}
            spacing={3}
        >
            {/* <StyledFilter>
                <StyledFilterList dense={true}>
                    <List.Item
                        secondaryAction={
                            <List.ItemButton
                                onClick={() => {
                                    setIsFilterOpen(!isFilterOpen);
                                }}
                            >
                                {isFilterOpen ? <ExpandLess /> : <ExpandMore />}
                            </List.ItemButton>
                        }
                    >
                        <List.ItemText
                            disableTypography
                            primary={
                                <Typography variant="h6">Filter By</Typography>
                            }
                        />
                    </List.Item>
                </StyledFilterList>
            </StyledFilter> */}

            <StyledContainer>
                {DEFAULT_TEMPLATE.map((t, idx) => {
                    return (
                        <AppTileCard
                            key={`default-template-${idx}`}
                            app={getAppMetadataFromTemplate(t)}
                            image={t.image}
                            onAction={() => onUse(t)}
                        />
                    );
                })}
            </StyledContainer>
        </Stack>
    );
};

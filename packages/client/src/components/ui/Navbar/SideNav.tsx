import { Drawer, List, Divider, Typography, Box } from '@semoss/ui';
import {
    Home as HomeIcon,
    Favorite as FavoriteIcon,
    GridView as GridViewIcon,
    Settings as SettingsIcon,
    Functions as FunctionsIcon,
    Close as CloseIcon,
    TokenRounded,
} from '@mui/icons-material';
import { ModelBrain } from '@/assets/img/ModelBrain';
import { Database } from '@/assets/img/Database';

const drawerWidth = 312;

const menuItems = [
    { text: 'Home', icon: <HomeIcon /> },
    { text: 'My Favorites', icon: <FavoriteIcon /> },
];

const catalogItems = [
    { text: 'Apps', icon: <GridViewIcon /> },
    {
        text: 'Models',
        icon: <ModelBrain color="#757575" width="24" height="24" />,
    },
    { text: 'Databases', icon: <Database color="#757575" /> },
    { text: 'Vectors', icon: <TokenRounded /> },
    { text: 'Functions', icon: <FunctionsIcon /> },
];

const teamItems = [
    { text: 'SEMOSS Dev', color: '#22A4FF' },
    { text: 'Netherlands Ops', color: '#FFB74D' },
    { text: 'Spain Dev Ops', color: '#7AC36B' },
    { text: 'Microsoft - Spain General', color: '#AA7EEA' },
];

const drawerStyles = {
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        borderRadius: '0 12px 12px 0',
        boxShadow: '4px 0px 4px 0px rgba(0, 0, 0, 0.05)',
    },
};

const headingStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 2,
    height: '56px',
};

const listStyles = {
    padding: 0,
    '&:hover': {
        backgroundColor: '#EBF4FE',
    },
};

const sectionTitleStyles = (fw = 600) => ({
    margin: '8px 16px',
    fontWeight: fw,
});

const teamIconStyles = (color: string) => ({
    width: 24,
    height: 24,
    backgroundColor: color,
    borderRadius: '4px',
});

const SideNav = () => {
    return (
        <Drawer variant="permanent" anchor="left" sx={drawerStyles}>
            {/* Drawer Heading */}
            <Box sx={headingStyles}>
                <Typography variant="h6" sx={sectionTitleStyles(700)}>
                    GovConnect.AI
                </Typography>
                <CloseIcon
                    sx={{
                        cursor: 'pointer',
                        color: 'text.secondary',
                    }}
                    onClick={() => {
                        console.log('Close button clicked');
                    }}
                />
            </Box>
            <Divider />

            {/* Main Menu */}
            <List sx={{ padding: 0 }}>
                {menuItems.map((item, index) => (
                    <List.Item key={index} sx={listStyles}>
                        <List.ItemButton>
                            <List.Icon>{item.icon}</List.Icon>
                            <List.ItemText primary={item.text} />
                        </List.ItemButton>
                    </List.Item>
                ))}
            </List>
            <Divider />

            {/* Catalog Section */}
            <Typography variant="subtitle1" sx={sectionTitleStyles()}>
                Catalogs
            </Typography>
            <List sx={{ padding: 0 }}>
                {catalogItems.map((item, index) => (
                    <List.Item key={index} sx={listStyles}>
                        <List.ItemButton>
                            <List.Icon>{item.icon}</List.Icon>
                            <List.ItemText primary={item.text} />
                        </List.ItemButton>
                    </List.Item>
                ))}
            </List>
            <Divider />

            {/* Teams Section */}
            <Typography variant="subtitle1" sx={sectionTitleStyles()}>
                Teams
            </Typography>
            <List sx={{ padding: 0 }}>
                {teamItems.map((item, index) => (
                    <List.Item key={index} sx={listStyles}>
                        <List.ItemButton>
                            <List.Icon>
                                <Box sx={teamIconStyles(item.color)} />
                            </List.Icon>
                            <List.ItemText primary={item.text} />
                        </List.ItemButton>
                    </List.Item>
                ))}
            </List>
            <Divider />

            {/* Settings */}
            <List sx={{ padding: 0 }}>
                <List.Item sx={listStyles}>
                    <List.ItemButton>
                        <List.Icon>
                            <SettingsIcon />
                        </List.Icon>
                        <List.ItemText primary="Settings" />
                    </List.ItemButton>
                </List.Item>
            </List>
            {/* <Divider /> */}
        </Drawer>
    );
};

export { SideNav };

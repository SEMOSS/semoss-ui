import { JiraSettings } from '../../settings';
import { TextFields } from "@mui/icons-material";
import { BlockSettingsConfig } from '../settings.types';

// Set the block type to match the registry key
const BLOCK_TYPE_JIRA = 'jira';

// export the config for the block
export const config: BlockSettingsConfig = {
    type: 'jira',
    icon: TextFields,
    contentMenu: [
        {
            name: "Jira Settings",
            children: [
                {
                    description: "Jira",
                    render: ({ id }) => (
                        <JiraSettings
                            id={id}
                            paths={['showCreateJiraForm','showCreatedJiraForm','listAllTickets','listedTickets']}
                            userId="userId"
                            connections={["jiraConnectionValue","jiraActionValue"]}
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
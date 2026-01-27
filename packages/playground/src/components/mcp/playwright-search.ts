import { runPixel } from "@semoss/sdk";

interface PlaywrightRecording {
  id?: string;
  name?: string;
  fileName?: string;
  title?: string;
  description?: string;
  intent?: string;
  project_id: string;
  project_name: string;
  steps?: Record<string, any[]>;
  [key: string]: any;
}

/**
 * Search for playwright recordings across all playwright projects
 * This provides a dynamic way to find recordings without pre-registering each one
 */
export async function searchPlaywrightRecordings(
  query: string,
  insightId: string
): Promise<PlaywrightRecording[]> {
  try {
    // Get all playwright projects
    const projectsPixel = `MyProjects(metaFilters=[{"tag":["PLAYWRIGHT"]}], filterWord=[""], onlyPortals=[true]);`;
    const projectsRes = await runPixel<[any[]]>(projectsPixel, insightId);
    
    if (projectsRes.pixelReturn[0].operationType?.includes("ERROR")) {
      throw new Error(`Failed to fetch projects: ${projectsRes.pixelReturn[0].output}`);
    }
    
    const projects = projectsRes.pixelReturn[0].output;
    
    if (!projects || projects.length === 0) {
      return [];
    }
    
    // Get recordings from each project
    const allRecordings: PlaywrightRecording[] = [];
    
    for (const project of projects) {
      try {
        const recordingsPixel = `ListPlaywrightScripts(project="${project.project_id}");`;
        const recordingsRes = await runPixel<[string[]]>(recordingsPixel, insightId);
        
        if (recordingsRes.pixelReturn[0].operationType?.includes("ERROR")) {
          continue;
        }
        
        const recordingNames = recordingsRes.pixelReturn[0].output;
        
        // Add recordings with basic info only, no steps fetching yet
        for (const recordingName of recordingNames) {
          // Parse the recording name for metadata
          const nameWithoutExt = recordingName.replace(/\.json$/, '');
          const parts = nameWithoutExt.split('-');
          const title = parts[0] || recordingName;
          
          allRecordings.push({
            fileName: recordingName,
            name: recordingName,
            title: title,
            description: recordingName,
            project_id: project.project_id,
            project_name: project.project_name
          });
        }
      } catch (err) {
        console.error(`Error fetching recordings from ${project.project_name}:`, err);
      }
    }
    
    // Filter by query if provided
    if (!query || query.trim() === '') {
      return allRecordings;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    return allRecordings.filter(recording => {
      const titleMatch = recording.title?.toLowerCase().includes(lowerQuery);
      const descriptionMatch = recording.description?.toLowerCase().includes(lowerQuery);
      const intentMatch = recording.intent?.toLowerCase().includes(lowerQuery);
      const nameMatch = recording.name?.toLowerCase().includes(lowerQuery);
      
      return titleMatch || descriptionMatch || intentMatch || nameMatch;
    });
    
  } catch (error) {
    console.error('Error searching playwright recordings:', error);
    throw error;
  }
}

/**
 * Get the steps for a specific playwright recording
 * Call this when a user actually selects a recording
 */
export async function getPlaywrightRecordingSteps(
  fileName: string,
  projectId: string,
  insightId: string
): Promise<{ steps?: Record<string, any[]>; intent?: string }> {
  try {
    const stepsPixel = `GetAllSteps(sessionId="temp", fileName="${fileName}", project="${projectId}");`;
    const stepsRes = await runPixel<[{ steps?: Record<string, any[]>; intent?: string }]>(stepsPixel, insightId);
    
    if (stepsRes.pixelReturn[0].operationType?.includes("ERROR")) {
      throw new Error(`Failed to fetch steps: ${stepsRes.pixelReturn[0].output}`);
    }
    
    return stepsRes.pixelReturn[0].output;
  } catch (error) {
    console.error(`Error fetching steps for ${fileName}:`, error);
    throw error;
  }
}

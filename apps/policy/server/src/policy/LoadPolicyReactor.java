package policy;

import prerna.project.api.IProject;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.nounmeta.NounMetadata;
import prerna.sablecc2.reactor.AbstractReactor;
import prerna.util.AssetUtility;
import prerna.util.Utility;

public class LoadPolicyReactor extends AbstractReactor {

	@Override
	public NounMetadata execute() {
		String contextProjectId = this.insight.getContextProjectId();
		if(contextProjectId == null) {
			contextProjectId = this.insight.getProjectId();
		}
		
		if(contextProjectId == null) {
			throw new IllegalArgumentException("Must set the context project to reference the policy bot files");
		}
		
		IProject project = Utility.getProject(contextProjectId);
		String openAI = project.getProp().getProperty("OPEN_AI_KEY");
		String assetsDir = AssetUtility.getProjectAssetFolder(contextProjectId).replace("\\", "/");
		
		String script = "import sys\n"+
			"import os\n"+
			"sys.path.append('"+assetsDir+"')\n"+
			"os.chdir('"+assetsDir+"')\n"+
			"import policy_bot2 as pb2\n"+
			"openai_key='"+openAI+"'\n"+
			"my_bot=pb2.PolicyBot(openai_key=openai_key)"
			;
		
		project.getProjectPyTranslator().runEmptyPy(script);
		return new NounMetadata(true, PixelDataType.BOOLEAN);
	}

}

package policy;

import prerna.project.api.IProject;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.nounmeta.NounMetadata;
import prerna.sablecc2.reactor.AbstractReactor;
import prerna.util.Utility;

public class RunPolicyReactor extends AbstractReactor {

	public RunPolicyReactor() {
		this.keysToGet = new String[] {"question"};
	}
	
	@Override
	public NounMetadata execute() {
		String contextProjectId = this.insight.getContextProjectId();
		if(contextProjectId == null) {
			contextProjectId = this.insight.getProjectId();
		}
		
		if(contextProjectId == null) {
			throw new IllegalArgumentException("Must set the context project to reference the policy bot files");
		}
		
		organizeKeys();
		String question = this.keyValue.get(this.keysToGet[0]);
		
		IProject project = Utility.getProject(contextProjectId);
		Object value = project.getProjectPyTranslator().runScript("my_bot.query(question='"+question+"')");
		return new NounMetadata(value, PixelDataType.CONST_STRING);
	}

}

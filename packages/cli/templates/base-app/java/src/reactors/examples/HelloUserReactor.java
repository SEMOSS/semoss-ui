package reactors.examples;

import prerna.auth.User;
import prerna.reactor.AbstractReactor;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.ReactorKeysEnum;
import prerna.sablecc2.om.nounmeta.NounMetadata;

/**
 * Example reactor that demonstrates basic functionality by greeting a user. This reactor accepts an
 * optional name parameter and returns a personalized greeting message. If no name is provided, it
 * uses the current user's name from the authentication context.
 *
 * <p>This class serves as a simple example of how to extend {@link AbstractProjectReactor} and
 * implement basic parameter handling and user context access.
 *
 * @see {@link AbstractProjectReactor} for base reactor functionality
 */
public class HelloUserReactor extends AbstractReactor {

  // Note: Has access to protected variables defined in AbstractProjectReactor

  /**
   * Constructs a HelloUserReactor and configures its expected input parameters. This constructor
   * sets up the reactor to accept an optional "name" parameter.
   */
  public HelloUserReactor() {

    // list of keys the reactor is expecting
    this.keysToGet = new String[] {ReactorKeysEnum.NAME.getKey()};

    // 1 for required keys, 0 for optional
    this.keyRequired = new int[] {0};
  }

  /**
   * Executes the main logic of the HelloUserReactor to generate a personalized greeting. This
   * method retrieves the optional name parameter and creates a welcome message. If no name
   * parameter is provided, it defaults to using the current authenticated user's name.
   *
   * <p>The method demonstrates how to:
   *
   * <ul>
   *   <li>Access optional parameters using {@link ReactorKeysEnum}
   *   <li>Use the protected {@code user} variable from {@link AbstractReactor}
   *   <li>Return string results wrapped in {@link NounMetadata}
   * </ul>
   *
   * @return A {@link NounMetadata} containing the greeting message as a constant string
   */
  @Override
  public NounMetadata execute() {
	  
	  User user = this.insight.getUser();
		if(user == null) {
			return NounMetadata.getErrorNounMessage("Cannot restart server. User not valid");
		}

    // returns null if the argument is not found
    String name = this.keyValue.get(ReactorKeysEnum.NAME.getKey());

    
    // if name is not provided, use the user's name
    name = (name == null) ? user.getPrimaryLoginToken().getName() : name;

    // grabbing user from AbstractProjectReactor
    String response = "Hello, " + name + "! Welcome to SEMOSS.";

    return new NounMetadata(response, PixelDataType.CONST_STRING);
  }
}

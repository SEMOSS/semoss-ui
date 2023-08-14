### Type
Must be one of the following:

* **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
* **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
* **docs**: Documentation only changes
* **feat**: A new feature
* **fix**: A bug fix
* **perf**: A code change that improves performance
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **test**: Adding missing tests or correcting existing tests

For example I have just created a new feature to the application where different users can now request access to different engines in the Catalog.  As this is new functionality to the users, the type of this commit would be a 'feat'.

### Scope
The scope should be the name of the package affected along with the overlying issue that was resolved with your commit.

The following is the list of supported scopes:


### For the Client package, the scopes are:
* **(client/api):**
* **(client/assets):**
* **(client/components):**
* **(client/contexts):**
* **(client/hooks):**
* **(client/pages):**
* **(client/stores):**
* **(client/packaging):**
* **(client/docs):**
* **(client/devtools):**
* **(client/environment):**


### For the Playsheet package, the scopes are:
* **(playsheet/SpreadJS):** 
* **(playsheet/bower_components):** 
* **(playsheet/custom):** 
* **(playsheet/resources):** 
* **(playsheet/standard):** 
* **(playsheet/packaging):** 
* **(playsheet/docs):** 
* **(playsheet/devtools):** 
* **(playsheet/config):** 
* **(playsheet/environment):** 


### For the Legacy package, the scopes are:
* **(legacy/core):** 
* **(legacy/custom):** 
* **(legacy/docs):** 
* **(legacy/react):** 
* **(legacy/style):** 
* **(legacy/typings):** 
* **(legacy/widget-resources):** 
* **(legacy/widgets):** 
* **(legacy/packaging):** 
* **(legacy/docs):** 
* **(legacy/devtools):** 
* **(legacy/config):** 
* **(legacy/environment):** 

### For the SDK package, the scopes are:
* **(sdk/react):** 
* **(sdk/ts):** 
* **(sdk/packaging):** 
* **(sdk/docs):** 
* **(sdk/devtools):** 
* **(sdk/config):** 
* **(sdk/environment):** 

### For the UI package, the scopes are:
The UI package is an exception. Use the specific component as the second part of the scope. 
example -> feat(ui/Catalog): add xyz to Catalog component
* **(ui/\<component>):** 
* **(ui/packaging):** 
* **(ui/docs):** 
* **(ui/devtools):** 
* **(ui/config):** 
* **(ui/environment):** 


### For the root level of the repo, the scopes are:
* **(packaging):** 
* **(docs):** 
* **(devtools):** 
* **(config):** 
* **(environment):** 



This list will be expanding as the repository continues to grow. Please share your thoughts and suggestions.

### Subject
The subject contains a succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize the first letter
* no dot (.) at the end

Continuing off the example provided with Type and Scope, as for the subject of our commit this reflects what has been done with the changes in the code. 'add RequestAccess reactor to the engine catalog at all three levels'.

With the three provided above our final commit message should look something like this.

'feat(client/Catalog): add RequestAccess reactor to the engine catalog at all three levels'
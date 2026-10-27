import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSerializer;

import jakarta.ws.rs.ApplicationPath;
import prerna.contract.ContractReader;
import prerna.contract.OperationContract;
import prerna.contract.TypeContract;

/** Exports selected contracts without initializing or executing backend operations. */
public final class ExportContracts {
    private record Selected(String name, String applicationPath, OperationContract contract) {}
    private record Catalog(int schemaVersion, List<Selected> operations) {}

    public static void main(String[] args) throws Exception {
        var selection = JsonParser.parseString(Files.readString(Path.of(args[0]))).getAsJsonObject();
        var operations = new ArrayList<Selected>();
        for (var entry : selection.getAsJsonArray("rest")) {
            var item = entry.getAsJsonObject();
            var application = load(item.get("application").getAsString());
            var prefix = application.getAnnotation(ApplicationPath.class);
            if (prefix == null) throw new IllegalArgumentException("Missing @ApplicationPath: " + application.getName());
            var resource = load(item.get("resource").getAsString());
            var parameters = new ArrayList<Class<?>>();
            for (var parameter : item.getAsJsonArray("parameterTypes")) {
                parameters.add(load(parameter.getAsString()));
            }
            var method = resource.getDeclaredMethod(item.get("method").getAsString(), parameters.toArray(Class<?>[]::new));
            operations.add(new Selected(method.getName(), prefix.value(), ContractReader.read(resource, method)));
        }
        for (var entry : selection.getAsJsonArray("pixels")) {
            var reactor = load(entry.getAsString());
            // This initial selection supports the ordinary global registration convention in
            // ReactorFactory.loadFromCP. Frame-specific registrations and custom aliases need
            // an explicit backend registration contract before being added to this exporter.
            if (!reactor.getName().startsWith("prerna.reactor.")
                    || reactor.getName().contains(".frame.")
                    || !reactor.getSimpleName().endsWith("Reactor")
                    || Modifier.isAbstract(reactor.getModifiers())
                    || !load("prerna.reactor.IReactor").isAssignableFrom(reactor)) {
                throw new IllegalArgumentException("Unsupported reactor registration: " + reactor.getName());
            }
            String name = reactor.getSimpleName().replaceFirst("Reactor$", "");
            operations.add(new Selected(name, null, ContractReader.read(reactor)));
        }
        operations.sort(Comparator.comparing(item -> item.contract().source()));
        Gson gson = new GsonBuilder().serializeNulls().disableHtmlEscaping()
                .registerTypeHierarchyAdapter(TypeContract.Shape.class, shapeSerializer()).create();
        Files.writeString(Path.of(args[1]), gson.toJson(new Catalog(1, operations)), StandardCharsets.UTF_8);
    }

    private static Class<?> load(String name) throws ClassNotFoundException {
        return switch (name) {
            case "boolean" -> boolean.class;
            case "byte" -> byte.class;
            case "short" -> short.class;
            case "int" -> int.class;
            case "long" -> long.class;
            case "float" -> float.class;
            case "double" -> double.class;
            case "char" -> char.class;
            default -> Class.forName(name, false, ExportContracts.class.getClassLoader());
        };
    }

    private static JsonSerializer<TypeContract.Shape> shapeSerializer() {
        return (shape, ignored, context) -> {
            var json = new JsonObject();
            // An explicit discriminator keeps empty shapes and scalar/decimal distinctions
            // usable by consumers in languages other than Java or TypeScript.
            switch (shape) {
                case TypeContract.Scalar scalar -> {
                    json.addProperty("type", "scalar");
                    json.addProperty("kind", scalar.kind().name());
                    json.add("values", context.serialize(scalar.values()));
                }
                case TypeContract.Sequence sequence -> {
                    json.addProperty("type", "sequence");
                    json.add("element", context.serialize(sequence.element()));
                }
                case TypeContract.Dictionary dictionary -> {
                    json.addProperty("type", "dictionary");
                    json.add("value", context.serialize(dictionary.value()));
                }
                case TypeContract.Union union -> {
                    json.addProperty("type", "union");
                    json.add("alternatives", context.serialize(union.alternatives()));
                }
                case TypeContract.Reference reference -> {
                    json.addProperty("type", "reference");
                    json.addProperty("id", reference.id());
                }
                case TypeContract.Unknown unknown -> json.addProperty("type", "unknown");
                case TypeContract.Empty empty -> json.addProperty("type", "empty");
            }
            return json;
        };
    }
}

import Foundation

/// Carga el catálogo de pruebas físicas desde `tests_catalog.json`.
///
/// Añadir una prueba nueva a la app consiste en añadir una entrada a ese
/// JSON (y, opcionalmente, un baremo para que puntúe): no hace falta tocar
/// ninguna vista ni ningún servicio.
final class TestCatalogRepository {
    static let shared = TestCatalogRepository()

    private let tests: [PhysicalTestDefinition]

    init(bundle: Bundle = .main, resourceName: String = "tests_catalog") {
        self.tests = Self.load(from: bundle, resourceName: resourceName)
    }

    private static func load(from bundle: Bundle, resourceName: String) -> [PhysicalTestDefinition] {
        guard let url = bundle.url(forResource: resourceName, withExtension: "json") else {
            assertionFailure("No se encontró \(resourceName).json en el bundle.")
            return []
        }
        do {
            let data = try Data(contentsOf: url)
            let decoded = try JSONDecoder().decode([PhysicalTestDefinition].self, from: data)
            return decoded.sorted { $0.order < $1.order }
        } catch {
            assertionFailure("Error decodificando \(resourceName).json: \(error)")
            return []
        }
    }

    func allTests() -> [PhysicalTestDefinition] { tests }

    func test(withId id: String) -> PhysicalTestDefinition? {
        tests.first { $0.id == id }
    }
}

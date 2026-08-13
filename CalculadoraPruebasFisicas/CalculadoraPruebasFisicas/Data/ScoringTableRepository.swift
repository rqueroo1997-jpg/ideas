import Foundation

/// Fuente de todas las tablas de baremo disponibles: las de ejemplo
/// empaquetadas con la app (ver `Data/Baremos/Ejemplo`, todas marcadas
/// explícitamente como NO oficiales) y las que el usuario importe desde
/// Configuración.
///
/// Esta clase es puramente de datos: no calcula ninguna puntuación. El
/// cálculo vive únicamente en `ScoringService`.
final class ScoringTableRepository {
    static let shared = ScoringTableRepository()

    private let bundledTables: [ScoringTable]

    init(bundle: Bundle = .main) {
        self.bundledTables = Self.loadBundledExampleTables(from: bundle)
    }

    /// Decodifica un `ScoringTable` a partir de un JSON (usado tanto para los
    /// baremos de ejemplo empaquetados como para los importados por el usuario).
    static func decode(_ data: Data) throws -> ScoringTable {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(ScoringTable.self, from: data)
    }

    private static func loadBundledExampleTables(from bundle: Bundle) -> [ScoringTable] {
        guard let manifestURL = bundle.url(forResource: "manifest", withExtension: "json") else {
            return []
        }
        guard
            let manifestData = try? Data(contentsOf: manifestURL),
            let fileNames = try? JSONDecoder().decode([String].self, from: manifestData)
        else {
            assertionFailure("No se pudo leer manifest.json de baremos de ejemplo.")
            return []
        }

        return fileNames.compactMap { name -> ScoringTable? in
            guard let url = bundle.url(forResource: name, withExtension: "json") else {
                assertionFailure("Falta el archivo de baremo \(name).json referenciado en manifest.json.")
                return nil
            }
            guard let data = try? Data(contentsOf: url) else { return nil }
            do {
                return try decode(data)
            } catch {
                assertionFailure("Error decodificando el baremo \(name).json: \(error)")
                return nil
            }
        }
    }

    /// Tablas de ejemplo empaquetadas con la app. Nunca deben presentarse como oficiales.
    func bundledExampleTables() -> [ScoringTable] {
        bundledTables
    }

    /// Combina las tablas de ejemplo con las importadas por el usuario (JSON en bruto).
    func allTables(importedRawJSON: [Data]) -> [ScoringTable] {
        let imported = importedRawJSON.compactMap { try? Self.decode($0) }
        return bundledTables + imported
    }
}

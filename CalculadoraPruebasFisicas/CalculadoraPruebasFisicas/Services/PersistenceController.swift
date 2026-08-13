import Foundation
import SwiftData

/// Configura el `ModelContainer` de SwiftData usado por toda la app.
/// Todos los datos se guardan localmente en el dispositivo; la app no usa
/// ningún servidor ni cuenta de usuario en esta versión.
enum PersistenceController {
    static let schema = Schema([
        UserProfile.self,
        TestSession.self,
        TestAttempt.self,
        ImportedScoringTableFile.self
    ])

    /// Contenedor persistente por defecto (almacenamiento en disco).
    static func makeContainer() -> ModelContainer {
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("No se pudo crear el ModelContainer de SwiftData: \(error)")
        }
    }

    /// Contenedor en memoria, usado en previews y tests.
    static func makePreviewContainer() -> ModelContainer {
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("No se pudo crear el ModelContainer en memoria: \(error)")
        }
    }
}

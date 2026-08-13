import Foundation
import Observation
import SwiftData

/// Gestiona la importación de baremos y la información de privacidad mostrada
/// en Configuración. La app nunca marca automáticamente un baremo importado
/// como oficial: es el usuario quien debe confirmarlo explícitamente tras
/// comprobar la fuente.
@Observable
final class SettingsViewModel {
    var errorMessage: String?

    private let loader = ScoringTableLoader()

    func importTable(from url: URL, context: ModelContext) {
        errorMessage = nil
        do {
            let imported = try loader.importTable(from: url)
            let record = ImportedScoringTableFile(
                fileName: imported.suggestedFileName,
                jsonData: imported.rawJSON,
                confirmedOfficial: false
            )
            context.insert(record)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func delete(_ file: ImportedScoringTableFile, from context: ModelContext) {
        context.delete(file)
    }

    func setConfirmedOfficial(_ file: ImportedScoringTableFile, to value: Bool) {
        file.confirmedOfficial = value
    }

    func decode(_ file: ImportedScoringTableFile) -> ScoringTable? {
        try? ScoringTableRepository.decode(file.jsonData)
    }
}

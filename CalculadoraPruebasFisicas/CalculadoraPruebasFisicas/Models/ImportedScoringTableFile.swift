import Foundation
import SwiftData

/// Almacena un archivo de baremo (JSON) importado por el usuario desde
/// Configuración, para poder decodificarlo en cualquier arranque de la app
/// sin depender de que el archivo original siga en el sistema de archivos.
@Model
final class ImportedScoringTableFile {
    var id: UUID = UUID()
    var fileName: String = ""
    var jsonData: Data = Data()
    var importedAt: Date = Date()
    /// El usuario debe confirmar explícitamente si el archivo procede de una
    /// normativa oficial verificada. Nunca se asume `true` por defecto.
    var confirmedOfficial: Bool = false

    init(fileName: String, jsonData: Data, confirmedOfficial: Bool = false) {
        self.id = UUID()
        self.fileName = fileName
        self.jsonData = jsonData
        self.importedAt = Date()
        self.confirmedOfficial = confirmedOfficial
    }
}

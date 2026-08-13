import Foundation

enum ScoringTableImportError: LocalizedError {
    case cannotReadFile
    case invalidFormat(underlying: Error)

    var errorDescription: String? {
        switch self {
        case .cannotReadFile:
            return "No se ha podido leer el archivo seleccionado."
        case .invalidFormat(let underlying):
            return "El archivo no tiene el formato esperado de baremo: \(underlying.localizedDescription)"
        }
    }
}

/// Valida e importa un archivo JSON de baremo elegido por el usuario desde
/// Configuración. La app nunca marca un baremo importado como "oficial
/// verificado" automáticamente: es el usuario quien debe confirmarlo.
struct ScoringTableLoader {

    struct ImportedTable {
        var table: ScoringTable
        var rawJSON: Data
        var suggestedFileName: String
    }

    func importTable(from url: URL) throws -> ImportedTable {
        let didAccess = url.startAccessingSecurityScopedResource()
        defer { if didAccess { url.stopAccessingSecurityScopedResource() } }

        guard let data = try? Data(contentsOf: url) else {
            throw ScoringTableImportError.cannotReadFile
        }

        do {
            let table = try ScoringTableRepository.decode(data)
            return ImportedTable(table: table, rawJSON: data, suggestedFileName: url.lastPathComponent)
        } catch {
            throw ScoringTableImportError.invalidFormat(underlying: error)
        }
    }
}

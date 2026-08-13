import Foundation

/// Sexo biológico usado para filtrar baremos. Solo se pide porque los baremos
/// oficiales de pruebas físicas suelen publicarse diferenciados por sexo.
enum Sex: String, Codable, CaseIterable, Identifiable {
    case male = "hombre"
    case female = "mujer"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .male: return "Hombre"
        case .female: return "Mujer"
        }
    }
}

/// Tipo de magnitud que se introduce para una prueba física.
/// Permite generar el formulario de introducción de marca de forma genérica,
/// sin tener que crear una pantalla nueva por cada prueba.
enum MeasurementKind: String, Codable, CaseIterable {
    case time            // minutos, segundos, centésimas -> almacenado en segundos totales
    case distanceMeters  // metros
    case repetitions     // repeticiones (abdominales, flexiones...)
    case count           // número de ejercicios / intentos realizados
    case points          // puntuación directa ya calculada externamente
}

/// Procedencia de una tabla de baremo. La app nunca debe mostrar un baremo
/// como oficial si no procede de una fuente verificada por el usuario.
enum BaremoOrigin: String, Codable, CaseIterable {
    case official   // Tabla oficial verificada (normativa/convocatoria real)
    case user       // Introducida manualmente por el usuario
    case training   // Baremo de entrenamiento, orientativo, no evaluador

    var displayName: String {
        switch self {
        case .official: return "Oficial verificado"
        case .user: return "Introducido por el usuario"
        case .training: return "Entrenamiento (orientativo)"
        }
    }
}

/// Distingue una evaluación oficial de una sesión de entrenamiento libre.
enum SessionMode: String, Codable, CaseIterable {
    case official
    case training
}

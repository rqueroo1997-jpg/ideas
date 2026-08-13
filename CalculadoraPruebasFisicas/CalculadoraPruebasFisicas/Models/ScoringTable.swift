import Foundation

/// Procedencia y trazabilidad de un baremo. Se muestra siempre en la app bajo
/// "Fuente del baremo" para que el usuario sepa si está evaluándose con datos
/// oficiales verificados o con datos orientativos.
struct ScoringSource: Codable, Hashable {
    /// Nombre de la normativa (p.ej. "Orden DEF.../Anexo de pruebas físicas").
    var name: String
    /// Convocatoria a la que pertenece el baremo, si aplica.
    var callNumber: String?
    /// Fecha de publicación oficial de la normativa, si se conoce.
    var publishedDate: Date?
    /// Referencia/URL/documento del que procede el baremo.
    var reference: String?
    /// Fecha en la que este baremo se actualizó por última vez dentro de la app.
    var lastUpdated: Date
    /// Debe ser `true` únicamente cuando el usuario ha confirmado que la tabla
    /// procede de una normativa oficial verificada. Por defecto `false`.
    var verified: Bool
    var origin: BaremoOrigin

    /// Etiqueta corta para mostrar como badge en la interfaz.
    var badgeText: String {
        switch origin {
        case .official where verified:
            return "Oficial verificado"
        case .official:
            return "Oficial (sin verificar)"
        case .user:
            return "Baremo del usuario"
        case .training:
            return "Entrenamiento"
        }
    }
}

/// Tramo de puntuación: si la marca cae entre `minimum` y `maximum` (ambos
/// incluidos), se asigna `score`.
struct ScoreRange: Codable, Hashable {
    var minimum: Double
    var maximum: Double
    var score: Double
}

/// Tabla de baremo para una prueba, sexo y rango de edad concretos.
///
/// Los baremos están completamente separados de la lógica de cálculo
/// (`ScoringService`) y de las vistas: se cargan como datos (JSON) y se
/// pueden sustituir o ampliar sin recompilar la app.
struct ScoringTable: Codable, Identifiable, Hashable {
    var testId: String
    var sex: Sex
    var ageRangeId: String
    var ageMin: Int
    var ageMax: Int
    /// Categoría/convocatoria opcional (p.ej. "Tropa y Marinería"). `nil` = aplica a todas.
    var category: String?
    /// Puntuación mínima (sobre el total de `ranges`) que se considera APTO para esta prueba.
    var passingScore: Double
    var ranges: [ScoreRange]
    var source: ScoringSource

    var id: String {
        [testId, sex.rawValue, ageRangeId, category ?? "general", source.name]
            .joined(separator: "|")
    }

    func matches(age: Int, sex: Sex, category: String?) -> Bool {
        guard self.sex == sex, age >= ageMin, age <= ageMax else { return false }
        guard let tableCategory = self.category else { return true }
        return category == tableCategory
    }
}

import Foundation

/// Resultado de calcular la puntuación de una marca contra un baremo.
/// No se persiste directamente: la vista/ViewModel decide cuándo convertirlo
/// en un `TestAttempt` para guardarlo en el historial.
struct ScoreResult: Identifiable, Hashable {
    var id: String { test.id }
    var test: PhysicalTestDefinition
    var mark: TestMeasurement
    var score: Double
    var maxScore: Double
    var isApto: Bool
    var matchedTable: ScoringTable?

    /// Puntuación formateada tipo "8,5 / 10".
    var scoreLabel: String {
        "\(Formatters.decimal(score)) / \(Formatters.decimal(maxScore))"
    }
}

/// Resultado final agregado de una sesión (todas las pruebas evaluadas).
struct FinalResult: Hashable {
    var results: [ScoreResult]
    var totalScore: Double { results.reduce(0) { $0 + $1.score } }
    var maxPossibleScore: Double { results.reduce(0) { $0 + $1.maxScore } }
    var isApto: Bool { !results.isEmpty && results.allSatisfy { $0.isApto } }
}

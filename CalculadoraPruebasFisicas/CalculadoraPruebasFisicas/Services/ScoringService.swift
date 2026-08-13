import Foundation

enum ScoringError: LocalizedError {
    case noTableFound(testName: String)

    var errorDescription: String? {
        switch self {
        case .noTableFound(let testName):
            return "No hay ningún baremo cargado para \"\(testName)\" que coincida con la edad, el sexo y la categoría del perfil. Añádelo en Configuración > Baremos."
        }
    }
}

/// Único responsable de calcular puntuaciones. No conoce SwiftUI ni SwiftData:
/// recibe datos y devuelve datos, lo que permite probarlo con tests unitarios
/// de forma completamente aislada.
final class ScoringService {

    /// Calcula la puntuación de una marca para una prueba concreta, buscando
    /// entre `tables` el baremo aplicable a la edad, el sexo y la categoría dados.
    func score(
        test: PhysicalTestDefinition,
        mark: TestMeasurement,
        age: Int,
        sex: Sex,
        category: String?,
        tables: [ScoringTable]
    ) throws -> ScoreResult {
        let candidates = tables.filter { $0.testId == test.id && $0.matches(age: age, sex: sex, category: category) }
        guard !candidates.isEmpty else {
            throw ScoringError.noTableFound(testName: test.name)
        }
        // Si coinciden varias tablas (p.ej. una general y otra específica de
        // categoría), se prioriza siempre la más específica.
        let table = candidates.min { ($0.category == nil ? 1 : 0) < ($1.category == nil ? 1 : 0) }!

        let maxScore = table.ranges.map(\.score).max() ?? 0
        let score = Self.lookupScore(mark: mark.value, in: table)
        let isApto = score >= table.passingScore

        return ScoreResult(test: test, mark: mark, score: score, maxScore: maxScore, isApto: isApto, matchedTable: table)
    }

    /// Agrega varios resultados individuales en un resultado final.
    func aggregate(_ results: [ScoreResult]) -> FinalResult {
        FinalResult(results: results)
    }

    /// Busca el tramo de puntuación cuyo rango [minimum, maximum] contiene la marca.
    static func lookupScore(mark: Double, in table: ScoringTable) -> Double {
        let sorted = table.ranges.sorted { $0.minimum < $1.minimum }
        guard !sorted.isEmpty else { return 0 }

        if let exact = sorted.first(where: { mark >= $0.minimum && mark <= $0.maximum }) {
            return exact.score
        }
        if mark < sorted.first!.minimum {
            return sorted.first!.score
        }
        // Por encima del último tramo definido, o dentro de un hueco entre
        // tramos de una tabla mal formada: se aplica la puntuación del
        // último tramo cuyo mínimo ya se ha superado, en lugar de fallar.
        return sorted.last(where: { mark >= $0.minimum })?.score ?? sorted.last!.score
    }
}

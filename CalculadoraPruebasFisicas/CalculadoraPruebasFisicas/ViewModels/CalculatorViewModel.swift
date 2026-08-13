import Foundation
import Observation
import SwiftData

/// Dirige el flujo de la Calculadora: seleccionar prueba, introducir marca,
/// calcular puntuación y acumular resultados hasta guardar la sesión.
/// La lógica de cálculo en sí vive en `ScoringService`; este ViewModel solo
/// coordina el flujo y el estado de la pantalla.
@Observable
final class CalculatorViewModel {
    let id = UUID()
    private(set) var results: [ScoreResult] = []
    var errorMessage: String?
    var mode: SessionMode = .official

    private let scoringService = ScoringService()

    var finalResult: FinalResult {
        scoringService.aggregate(results)
    }

    func result(for testId: String) -> ScoreResult? {
        results.first { $0.test.id == testId }
    }

    func calculate(
        test: PhysicalTestDefinition,
        mark: TestMeasurement,
        profile: UserProfile,
        availableTables: [ScoringTable]
    ) {
        errorMessage = nil
        do {
            let result = try scoringService.score(
                test: test,
                mark: mark,
                age: profile.age,
                sex: profile.sex,
                category: profile.category,
                tables: availableTables
            )
            if let index = results.firstIndex(where: { $0.test.id == test.id }) {
                results[index] = result
            } else {
                results.append(result)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func removeResult(for testId: String) {
        results.removeAll { $0.test.id == testId }
    }

    func reset() {
        results = []
        errorMessage = nil
    }

    /// Persiste la sesión actual (todas las pruebas calculadas) en el historial.
    @discardableResult
    func saveSession(profile: UserProfile, context: ModelContext) -> TestSession {
        let session = TestSession(profileId: profile.id, profileNameSnapshot: profile.displayName, mode: mode)
        context.insert(session)

        for result in results {
            let attempt = TestAttempt(
                testId: result.test.id,
                testNameSnapshot: result.test.name,
                markValue: result.mark.value,
                markDisplayText: result.mark.displayText,
                score: result.score,
                maxScore: result.maxScore,
                isApto: result.isApto,
                scoringSourceName: result.matchedTable?.source.name ?? "—",
                scoringOrigin: result.matchedTable?.source.origin ?? .training
            )
            attempt.session = session
            session.attempts.append(attempt)
        }
        session.recomputeTotals()
        return session
    }
}

// Identidad por referencia: permite pasar la misma instancia a través de la
// pila de navegación (NavigationStack) para acumular resultados entre pantallas.
extension CalculatorViewModel: Hashable {
    static func == (lhs: CalculatorViewModel, rhs: CalculatorViewModel) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

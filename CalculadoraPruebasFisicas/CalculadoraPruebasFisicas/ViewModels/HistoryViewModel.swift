import Foundation
import Observation
import SwiftData

/// Punto de evolución de una prueba concreta a lo largo del tiempo, usado
/// para alimentar los gráficos de "Mis resultados".
struct EvolutionPoint: Identifiable, Hashable {
    var id: UUID = UUID()
    var date: Date
    var score: Double
    var markValue: Double
}

@Observable
final class HistoryViewModel {

    /// Extrae la evolución de una prueba concreta a partir del histórico de sesiones,
    /// ordenada cronológicamente.
    func evolution(for testId: String, in sessions: [TestSession]) -> [EvolutionPoint] {
        sessions
            .compactMap { session -> EvolutionPoint? in
                guard let attempt = session.attempts.first(where: { $0.testId == testId }) else { return nil }
                return EvolutionPoint(date: session.date, score: attempt.score, markValue: attempt.markValue)
            }
            .sorted { $0.date < $1.date }
    }

    /// Evolución de la puntuación total por sesión.
    func totalScoreEvolution(in sessions: [TestSession]) -> [EvolutionPoint] {
        sessions
            .sorted { $0.date < $1.date }
            .map { EvolutionPoint(date: $0.date, score: $0.totalScore, markValue: $0.totalScore) }
    }

    func delete(_ session: TestSession, from context: ModelContext) {
        context.delete(session)
    }
}

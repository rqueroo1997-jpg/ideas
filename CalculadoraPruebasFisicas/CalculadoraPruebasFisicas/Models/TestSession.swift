import Foundation
import SwiftData

/// Una sesión agrupa los intentos (pruebas) realizados en una misma fecha,
/// ya sea una evaluación oficial completa o una sesión de entrenamiento.
@Model
final class TestSession {
    var id: UUID = UUID()
    var date: Date = Date()
    var profileId: UUID = UUID()
    var profileNameSnapshot: String = ""
    var mode: SessionMode = SessionMode.official
    var totalScore: Double = 0
    var maxPossibleScore: Double = 0
    var isApto: Bool = false

    @Relationship(deleteRule: .cascade, inverse: \TestAttempt.session)
    var attempts: [TestAttempt] = []

    init(profileId: UUID, profileNameSnapshot: String, mode: SessionMode, date: Date = Date()) {
        self.id = UUID()
        self.date = date
        self.profileId = profileId
        self.profileNameSnapshot = profileNameSnapshot
        self.mode = mode
        self.totalScore = 0
        self.maxPossibleScore = 0
        self.isApto = false
        self.attempts = []
    }

    /// Recalcula el total y el estado APTO/NO APTO a partir de los intentos actuales.
    func recomputeTotals() {
        totalScore = attempts.reduce(0) { $0 + $1.score }
        maxPossibleScore = attempts.reduce(0) { $0 + $1.maxScore }
        isApto = !attempts.isEmpty && attempts.allSatisfy { $0.isApto }
    }
}

/// Resultado de una prueba individual dentro de una sesión.
@Model
final class TestAttempt {
    var id: UUID = UUID()
    var testId: String = ""
    var testNameSnapshot: String = ""
    var markValue: Double = 0
    var markDisplayText: String = ""
    var score: Double = 0
    var maxScore: Double = 0
    var isApto: Bool = false
    /// Nombre de la fuente del baremo usado, para trazabilidad del resultado.
    var scoringSourceName: String = ""
    var scoringOrigin: BaremoOrigin = BaremoOrigin.training

    var session: TestSession?

    init(
        testId: String,
        testNameSnapshot: String,
        markValue: Double,
        markDisplayText: String,
        score: Double,
        maxScore: Double,
        isApto: Bool,
        scoringSourceName: String,
        scoringOrigin: BaremoOrigin
    ) {
        self.id = UUID()
        self.testId = testId
        self.testNameSnapshot = testNameSnapshot
        self.markValue = markValue
        self.markDisplayText = markDisplayText
        self.score = score
        self.maxScore = maxScore
        self.isApto = isApto
        self.scoringSourceName = scoringSourceName
        self.scoringOrigin = scoringOrigin
    }
}

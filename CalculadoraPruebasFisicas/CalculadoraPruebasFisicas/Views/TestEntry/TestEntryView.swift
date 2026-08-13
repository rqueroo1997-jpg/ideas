import SwiftUI
import SwiftData

/// Pantalla "Calculadora" para una prueba concreta: introducir marca,
/// calcular puntuación y mostrar el resultado (Marca / Puntuación / Resultado).
struct TestEntryView: View {
    var profile: UserProfile
    var test: PhysicalTestDefinition
    var calculator: CalculatorViewModel
    @Binding var path: [AppRoute]

    @Query private var importedFiles: [ImportedScoringTableFile]

    @State private var minutes = 0
    @State private var seconds = 0
    @State private var centiseconds = 0
    @State private var numericValue = ""
    @State private var validationError: String?

    private var currentResult: ScoreResult? { calculator.result(for: test.id) }

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                VStack(spacing: 4) {
                    Image(systemName: test.icon)
                        .font(.system(size: 36))
                        .foregroundStyle(Color.accentColor)
                    Text(test.name.uppercased())
                        .font(.title.bold())
                }
                .padding(.top, 12)

                VStack(spacing: 10) {
                    Text("Marca")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    MeasurementInputField(
                        kind: test.measurementKind,
                        unitLabel: test.unitLabel,
                        minutes: $minutes,
                        seconds: $seconds,
                        centiseconds: $centiseconds,
                        numericValue: $numericValue
                    )
                    if let helpText = test.helpText {
                        Text(helpText)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                }
                .cardStyle()

                if let validationError {
                    Text(validationError)
                        .font(.footnote)
                        .foregroundStyle(Color.noAptoColor)
                        .multilineTextAlignment(.center)
                }
                if let errorMessage = calculator.errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(Color.noAptoColor)
                        .multilineTextAlignment(.center)
                }

                PrimaryButton(title: "Calcular", systemImage: "equal.circle.fill", action: calculate)

                if let currentResult {
                    resultCard(currentResult)
                }
            }
            .padding()
        }
        .navigationTitle(test.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func resultCard(_ result: ScoreResult) -> some View {
        VStack(spacing: 16) {
            Text("Puntuación")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            ScoreBadge(score: result.score, maxScore: result.maxScore)
            Text("Resultado")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            StatusIndicator(isApto: result.isApto)

            if let source = result.matchedTable?.source {
                sourceFootnote(source)
            }

            PrimaryButton(title: "Volver a pruebas", systemImage: "chevron.left", kind: .secondary) {
                if !path.isEmpty { path.removeLast() }
            }
        }
        .cardStyle()
    }

    private func sourceFootnote(_ source: ScoringSource) -> some View {
        VStack(spacing: 4) {
            Text(source.badgeText)
                .font(.caption.bold())
                .foregroundStyle(source.verified ? Color.aptoColor : .orange)
            Text(source.name)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    private func calculate() {
        validationError = nil
        do {
            let mark: TestMeasurement
            switch test.measurementKind {
            case .time:
                try Validators.validateTime(minutes: minutes, seconds: seconds, centiseconds: centiseconds)
                mark = .time(minutes: minutes, seconds: seconds, centiseconds: centiseconds)
            case .distanceMeters, .repetitions, .count, .points:
                let normalized = numericValue.replacingOccurrences(of: ",", with: ".")
                guard let value = Double(normalized) else {
                    throw ValidationError(message: "Introduce un número válido.")
                }
                try Validators.validatePositiveMeasurement(value, kind: test.measurementKind)
                mark = .plain(value, suffix: test.unitLabel)
            }

            let tables = ScoringTableRepository.shared.allTables(importedRawJSON: importedFiles.map(\.jsonData))
            calculator.calculate(test: test, mark: mark, profile: profile, availableTables: tables)
        } catch {
            validationError = error.localizedDescription
        }
    }
}

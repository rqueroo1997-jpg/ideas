import SwiftUI
import SwiftData

/// Modo entrenamiento: registrar marcas sin necesidad de una evaluación
/// oficial, y ver marca actual, mejor marca, promedio, evolución y objetivo.
struct TrainingModeView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \TestSession.date) private var allSessions: [TestSession]

    var profile: UserProfile

    @State private var selectedTest: PhysicalTestDefinition
    @State private var minutes = 0
    @State private var seconds = 0
    @State private var centiseconds = 0
    @State private var numericValue = ""
    @State private var goalText = ""
    @State private var validationError: String?

    private let historyViewModel = HistoryViewModel()

    init(profile: UserProfile) {
        self.profile = profile
        _selectedTest = State(initialValue: TestCatalogRepository.shared.allTests().first!)
    }

    private var trainingSessions: [TestSession] {
        allSessions.filter { $0.profileId == profile.id && $0.mode == .training }
    }

    private var marksForTest: [Double] {
        trainingSessions.compactMap { $0.attempts.first { $0.testId == selectedTest.id }?.markValue }
    }

    private var evolutionPoints: [EvolutionPoint] {
        historyViewModel
            .evolution(for: selectedTest.id, in: trainingSessions)
            .map { EvolutionPoint(date: $0.date, score: $0.markValue, markValue: $0.markValue) }
    }

    private var bestMark: Double? {
        guard !marksForTest.isEmpty else { return nil }
        return selectedTest.lowerIsBetter ? marksForTest.min() : marksForTest.max()
    }

    private var averageMark: Double? {
        guard !marksForTest.isEmpty else { return nil }
        return marksForTest.reduce(0, +) / Double(marksForTest.count)
    }

    private var goalKey: String { "training.goal.\(profile.id.uuidString).\(selectedTest.id)" }

    private var goalValue: Double? {
        let stored = UserDefaults.standard.double(forKey: goalKey)
        return stored == 0 ? nil : stored
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Picker("Prueba", selection: $selectedTest) {
                    ForEach(TestCatalogRepository.shared.allTests()) { test in
                        Text(test.name).tag(test)
                    }
                }
                .pickerStyle(.menu)

                MeasurementInputField(
                    kind: selectedTest.measurementKind,
                    unitLabel: selectedTest.unitLabel,
                    minutes: $minutes,
                    seconds: $seconds,
                    centiseconds: $centiseconds,
                    numericValue: $numericValue
                )

                if let validationError {
                    Text(validationError)
                        .font(.footnote)
                        .foregroundStyle(Color.noAptoColor)
                }

                PrimaryButton(title: "Guardar marca", systemImage: "plus.circle.fill", action: saveMark)

                statsGrid

                HStack {
                    Text("Objetivo")
                    TextField("Marca objetivo", text: $goalText)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                    Button("Guardar") { saveGoal() }
                }
                .cardStyle()

                EvolutionChart(title: "Evolución", points: evolutionPoints, valueForPoint: { $0.markValue }, valueLabel: "Marca")
            }
            .padding()
        }
        .navigationTitle("Modo entrenamiento")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if let goalValue { goalText = Formatters.decimal(goalValue) }
        }
        .onChange(of: selectedTest) {
            goalText = goalValue.map(Formatters.decimal) ?? ""
        }
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(title: "Marca actual", value: marksForTest.last.map(displayValue) ?? "—")
            statCard(title: "Mejor marca", value: bestMark.map(displayValue) ?? "—")
            statCard(title: "Promedio", value: averageMark.map(displayValue) ?? "—")
            statCard(title: "Diferencia con objetivo", value: differenceText)
        }
    }

    private var differenceText: String {
        guard let goalValue, let last = marksForTest.last else { return "—" }
        // Se muestra la diferencia en valor absoluto: el signo depende de si
        // menor es mejor o no, y aquí solo interesa la magnitud restante.
        return displayValue(abs(last - goalValue))
    }

    private func displayValue(_ value: Double) -> String {
        if selectedTest.measurementKind == .time {
            return Formatters.timeFromSeconds(value)
        }
        return Formatters.decimal(value)
    }

    private func statCard(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title3.bold())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
    }

    private func saveGoal() {
        let normalized = goalText.replacingOccurrences(of: ",", with: ".")
        guard let value = Double(normalized) else { return }
        UserDefaults.standard.set(value, forKey: goalKey)
    }

    private func saveMark() {
        validationError = nil
        do {
            let mark: TestMeasurement
            switch selectedTest.measurementKind {
            case .time:
                try Validators.validateTime(minutes: minutes, seconds: seconds, centiseconds: centiseconds)
                mark = .time(minutes: minutes, seconds: seconds, centiseconds: centiseconds)
            case .distanceMeters, .repetitions, .count, .points:
                let normalized = numericValue.replacingOccurrences(of: ",", with: ".")
                guard let value = Double(normalized) else {
                    throw ValidationError(message: "Introduce un número válido.")
                }
                try Validators.validatePositiveMeasurement(value, kind: selectedTest.measurementKind)
                mark = .plain(value, suffix: selectedTest.unitLabel)
            }

            let session = TestSession(profileId: profile.id, profileNameSnapshot: profile.displayName, mode: .training)
            context.insert(session)
            let attempt = TestAttempt(
                testId: selectedTest.id,
                testNameSnapshot: selectedTest.name,
                markValue: mark.value,
                markDisplayText: mark.displayText,
                score: 0,
                maxScore: 0,
                isApto: false,
                scoringSourceName: "Entrenamiento (sin evaluar)",
                scoringOrigin: .training
            )
            attempt.session = session
            session.attempts.append(attempt)
            session.recomputeTotals()
        } catch {
            validationError = error.localizedDescription
        }
    }
}

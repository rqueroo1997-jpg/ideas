import SwiftUI
import SwiftData

/// Detalle de un resultado del historial, con el desglose por prueba y la
/// evolución de cada marca a lo largo del tiempo.
struct HistoryDetailView: View {
    @Query(sort: \TestSession.date) private var allSessions: [TestSession]
    var session: TestSession

    private let historyViewModel = HistoryViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(spacing: 6) {
                    Text(Formatters.dateTime(session.date))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text("\(Formatters.decimal(session.totalScore)) / \(Formatters.decimal(session.maxPossibleScore))")
                        .font(.largeTitle.bold())
                    StatusIndicator(isApto: session.isApto)
                }
                .padding(.top, 12)

                VStack(spacing: 0) {
                    ForEach(session.attempts.sorted(by: { $0.testNameSnapshot < $1.testNameSnapshot })) { attempt in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(attempt.testNameSnapshot).font(.headline)
                                Text(attempt.markDisplayText).font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("\(Formatters.decimal(attempt.score)) / \(Formatters.decimal(attempt.maxScore))")
                                    .font(.subheadline.bold())
                                StatusIndicator(isApto: attempt.isApto, compact: true)
                            }
                        }
                        .padding(.vertical, 8)
                        Divider()
                    }
                }
                .cardStyle()

                ForEach(session.attempts) { attempt in
                    EvolutionChart(
                        title: "Evolución · \(attempt.testNameSnapshot)",
                        points: historyViewModel.evolution(for: attempt.testId, in: allSessions)
                    )
                }
            }
            .padding()
        }
        .navigationTitle("Detalle del resultado")
        .navigationBarTitleDisplayMode(.inline)
    }
}

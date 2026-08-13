import SwiftUI
import SwiftData

/// Pantalla "Mis resultados": historial de sesiones con fecha, puntuación
/// total y estado APTO/NO APTO.
struct HistoryView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \TestSession.date, order: .reverse) private var sessions: [TestSession]
    @Binding var path: [AppRoute]

    var body: some View {
        Group {
            if sessions.isEmpty {
                ContentUnavailableView(
                    "Todavía no hay resultados",
                    systemImage: "chart.bar.xaxis",
                    description: Text("Completa una calculadora para ver aquí tu historial.")
                )
            } else {
                List {
                    ForEach(sessions) { session in
                        Button {
                            path.append(.historyDetail(session))
                        } label: {
                            row(for: session)
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete(perform: delete)
                }
            }
        }
        .navigationTitle("Mis resultados")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func row(for session: TestSession) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(Formatters.date(session.date))
                    .font(.headline)
                Text("\(session.attempts.count) pruebas · \(session.mode == .official ? "Evaluación" : "Entrenamiento")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(Formatters.decimal(session.totalScore))
                    .font(.subheadline.bold())
                StatusIndicator(isApto: session.isApto, compact: true)
            }
        }
        .padding(.vertical, 4)
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets {
            context.delete(sessions[index])
        }
    }
}

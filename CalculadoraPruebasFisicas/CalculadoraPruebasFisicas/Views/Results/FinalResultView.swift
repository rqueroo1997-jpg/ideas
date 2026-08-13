import SwiftUI
import SwiftData

/// Resultado global tras introducir todas las pruebas de la sesión, con
/// desglose por prueba, total y estado APTO / NO APTO.
struct FinalResultView: View {
    @Environment(\.modelContext) private var context

    var profile: UserProfile
    var calculator: CalculatorViewModel
    @Binding var path: [AppRoute]

    @State private var showShareSheet = false
    @State private var shareURL: URL?
    @State private var saved = false

    private var finalResult: FinalResult { calculator.finalResult }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("RESULTADO FINAL")
                    .font(.title2.bold())
                    .padding(.top, 12)

                VStack(spacing: 0) {
                    ForEach(finalResult.results) { result in
                        HStack {
                            Text(result.test.name)
                            Spacer()
                            Text(Formatters.decimal(result.score))
                                .fontWeight(.semibold)
                        }
                        .padding(.vertical, 10)
                        Divider()
                    }

                    HStack {
                        Text("TOTAL")
                            .font(.headline)
                        Spacer()
                        Text(Formatters.decimal(finalResult.totalScore))
                            .font(.headline)
                    }
                    .padding(.vertical, 14)
                }
                .cardStyle()

                VStack(spacing: 10) {
                    Text("ESTADO")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    StatusIndicator(isApto: finalResult.isApto)
                }

                if finalResult.results.count > 1 {
                    EvolutionChart(
                        title: "Puntuación por prueba",
                        points: finalResult.results.enumerated().map {
                            EvolutionPoint(date: Date().addingTimeInterval(Double($0.offset)), score: $0.element.score, markValue: $0.element.mark.value)
                        }
                    )
                }

                VStack(spacing: 12) {
                    PrimaryButton(title: saved ? "Guardado en el historial" : "Guardar en el historial", systemImage: "tray.and.arrow.down.fill") {
                        calculator.saveSession(profile: profile, context: context)
                        saved = true
                    }
                    PrimaryButton(title: "Compartir PDF", systemImage: "square.and.arrow.up", kind: .secondary) {
                        share()
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Resultado final")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showShareSheet) {
            if let shareURL {
                ShareSheet(activityItems: [shareURL])
            }
        }
    }

    private func share() {
        let data = ExportService().generatePDF(profileName: profile.displayName, date: Date(), result: finalResult)
        if let url = try? ExportService().writeTemporaryPDF(data: data, suggestedName: "resultado-\(profile.displayName)") {
            shareURL = url
            showShareSheet = true
        }
    }
}

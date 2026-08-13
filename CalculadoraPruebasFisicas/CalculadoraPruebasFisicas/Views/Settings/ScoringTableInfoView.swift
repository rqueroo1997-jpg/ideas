import SwiftUI

/// Sección "Fuente del baremo": muestra de forma explícita la procedencia de
/// una tabla de baremo para que nunca se confunda un dato orientativo con
/// uno oficial verificado.
struct ScoringTableInfoView: View {
    var table: ScoringTable

    var body: some View {
        NavigationStack {
            Form {
                Section("Prueba") {
                    LabeledContent("Prueba", value: TestCatalogRepository.shared.test(withId: table.testId)?.name ?? table.testId)
                    LabeledContent("Sexo", value: table.sex.displayName)
                    LabeledContent("Rango de edad", value: table.ageRangeId)
                    if let category = table.category {
                        LabeledContent("Categoría", value: category)
                    }
                    LabeledContent("Puntuación mínima APTO", value: Formatters.decimal(table.passingScore))
                }

                Section("Fuente del baremo") {
                    Label(table.source.badgeText, systemImage: table.source.verified ? "checkmark.seal.fill" : "exclamationmark.triangle.fill")
                        .foregroundStyle(table.source.verified ? Color.aptoColor : .orange)
                        .font(.subheadline.bold())

                    LabeledContent("Normativa", value: table.source.name)
                    if let callNumber = table.source.callNumber {
                        LabeledContent("Convocatoria", value: callNumber)
                    }
                    if let publishedDate = table.source.publishedDate {
                        LabeledContent("Fecha de publicación", value: Formatters.date(publishedDate))
                    }
                    if let reference = table.source.reference {
                        LabeledContent("Fuente", value: reference)
                    }
                    LabeledContent("Última actualización", value: Formatters.date(table.source.lastUpdated))
                }

                if !table.source.verified {
                    Section {
                        Text("Este baremo NO está verificado como oficial. Úsalo solo con fines orientativos o de entrenamiento hasta confirmar su procedencia.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Fuente del baremo")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

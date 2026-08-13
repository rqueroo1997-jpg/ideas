import SwiftUI
import Charts

/// Gráfico de evolución reutilizado en Historial y en el Modo entrenamiento.
struct EvolutionChart: View {
    var title: String
    var points: [EvolutionPoint]
    var valueForPoint: (EvolutionPoint) -> Double = { $0.score }
    var valueLabel: String = "Puntuación"

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)

            if points.count < 2 {
                Text("Todavía no hay suficientes resultados para mostrar una evolución.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 120)
            } else {
                Chart(points) { point in
                    LineMark(
                        x: .value("Fecha", point.date),
                        y: .value(valueLabel, valueForPoint(point))
                    )
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Fecha", point.date),
                        y: .value(valueLabel, valueForPoint(point))
                    )
                }
                .frame(height: 180)
                .accessibilityLabel("Gráfico de evolución de \(title)")
            }
        }
        .cardStyle()
    }
}

#Preview {
    EvolutionChart(
        title: "Carrera",
        points: [
            EvolutionPoint(date: .now.addingTimeInterval(-86400 * 30), score: 6, markValue: 800),
            EvolutionPoint(date: .now.addingTimeInterval(-86400 * 15), score: 7.5, markValue: 770),
            EvolutionPoint(date: .now, score: 8.5, markValue: 750)
        ]
    )
    .padding()
}

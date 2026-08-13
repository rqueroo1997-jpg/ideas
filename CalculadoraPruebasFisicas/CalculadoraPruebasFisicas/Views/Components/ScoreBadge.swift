import SwiftUI

/// Indicador circular de puntuación, p.ej. "8,5 / 10".
struct ScoreBadge: View {
    var score: Double
    var maxScore: Double

    private var fraction: Double {
        guard maxScore > 0 else { return 0 }
        return min(max(score / maxScore, 0), 1)
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(Color(.systemGray5), lineWidth: 10)
                Circle()
                    .trim(from: 0, to: fraction)
                    .stroke(Color.accentColor, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut, value: fraction)
                Text(Formatters.decimal(score))
                    .font(.title.bold())
                    .minimumScaleFactor(0.6)
            }
            .frame(width: 96, height: 96)

            Text("\(Formatters.decimal(score)) / \(Formatters.decimal(maxScore))")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Puntuación \(Formatters.decimal(score)) sobre \(Formatters.decimal(maxScore))")
    }
}

#Preview {
    ScoreBadge(score: 8.5, maxScore: 10)
}

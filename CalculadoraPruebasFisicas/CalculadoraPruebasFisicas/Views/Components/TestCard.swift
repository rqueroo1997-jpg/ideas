import SwiftUI

/// Tarjeta que representa una prueba física, usada en la selección de
/// pruebas y en el resumen de resultados.
struct TestCard: View {
    var test: PhysicalTestDefinition
    var scoreLabel: String? = nil
    var isApto: Bool? = nil

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: test.icon)
                .font(.title2)
                .frame(width: 44, height: 44)
                .background(Color.accentColor.opacity(0.15))
                .foregroundStyle(Color.accentColor)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(test.name)
                    .font(.headline)
                Text(test.unitLabel)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if let scoreLabel {
                VStack(alignment: .trailing, spacing: 4) {
                    Text(scoreLabel)
                        .font(.subheadline.bold())
                    if let isApto {
                        StatusIndicator(isApto: isApto, compact: true)
                    }
                }
            } else {
                Image(systemName: "chevron.right")
                    .foregroundStyle(.tertiary)
            }
        }
        .cardStyle()
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    VStack {
        TestCard(test: TestCatalogRepository.shared.allTests().first!)
        TestCard(test: TestCatalogRepository.shared.allTests().first!, scoreLabel: "8,5 / 10", isApto: true)
    }
    .padding()
}

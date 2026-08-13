import SwiftUI

/// Indicador visual APTO / NO APTO reutilizado en Inicio, Calculadora e Historial.
struct StatusIndicator: View {
    var isApto: Bool
    var compact: Bool = false

    var body: some View {
        Label(isApto ? "APTO" : "NO APTO", systemImage: isApto ? "checkmark.circle.fill" : "xmark.circle.fill")
            .font(compact ? .caption.bold() : .headline.bold())
            .foregroundStyle(isApto ? Color.aptoColor : Color.noAptoColor)
            .padding(.horizontal, compact ? 8 : 14)
            .padding(.vertical, compact ? 4 : 8)
            .background((isApto ? Color.aptoColor : Color.noAptoColor).opacity(0.15))
            .clipShape(Capsule())
            .accessibilityLabel(isApto ? "Apto" : "No apto")
    }
}

#Preview {
    VStack(spacing: 12) {
        StatusIndicator(isApto: true)
        StatusIndicator(isApto: false)
        StatusIndicator(isApto: true, compact: true)
    }
}

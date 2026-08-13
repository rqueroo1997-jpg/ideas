import SwiftUI

extension Color {
    /// Verde/rojo semánticos usados de forma consistente para APTO / NO APTO.
    static let aptoColor = Color(.systemGreen)
    static let noAptoColor = Color(.systemRed)
}

extension View {
    /// Aplica el estilo de tarjeta usado en toda la app (fondo, esquinas, sombra sutil).
    func cardStyle() -> some View {
        self
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

extension Double {
    /// Redondea a un decimal, útil para comparar puntuaciones sin errores de coma flotante.
    var roundedToOneDecimal: Double {
        (self * 10).rounded() / 10
    }
}

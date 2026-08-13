import SwiftUI

enum AppButtonKind {
    case primary, secondary, destructive
}

/// Botón grande y legible, pensado para usarse durante un entrenamiento
/// (dedos con guantes, poca luz, distracción). Reutilizado en toda la app.
struct PrimaryButton: View {
    var title: String
    var systemImage: String? = nil
    var kind: AppButtonKind = .primary
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
        }
        .buttonStyle(.borderedProminent)
        .tint(tintColor)
        .controlSize(.large)
    }

    private var tintColor: Color {
        switch kind {
        case .primary: return .accentColor
        case .secondary: return .gray
        case .destructive: return .red
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        PrimaryButton(title: "Nueva prueba", systemImage: "plus.circle.fill", action: {})
        PrimaryButton(title: "Mis resultados", systemImage: "chart.bar.fill", kind: .secondary, action: {})
        PrimaryButton(title: "Eliminar perfil", kind: .destructive, action: {})
    }
    .padding()
}

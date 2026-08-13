import SwiftUI

/// Explica de forma clara qué datos guarda la app y dónde.
struct PrivacyView: View {
    var body: some View {
        Form {
            Section("Almacenamiento local") {
                Text("Todos los datos que introduces (perfil, resultados, historial y baremos importados) se guardan únicamente en este dispositivo mediante SwiftData. La app no envía ningún dato a servidores externos ni requiere una cuenta de usuario.")
            }

            Section("Datos que se guardan") {
                Label("Nombre o alias, fecha de nacimiento, sexo, altura y peso (opcionales)", systemImage: "person.fill")
                Label("Resultados de las pruebas y el historial de sesiones", systemImage: "chart.bar.fill")
                Label("Baremos que importes manualmente desde Configuración", systemImage: "doc.badge.plus")
            }

            Section("Lo que no se pide") {
                Text("La app no solicita datos personales innecesarios (contacto, ubicación, identificadores de dispositivo, etc.) y no incluye analítica ni publicidad.")
            }

            Section("Compartir resultados") {
                Text("Cuando exportas un resultado en PDF o imagen, se genera localmente y se comparte usando las herramientas nativas de iOS. Tú decides con quién se comparte cada archivo.")
            }

            Section("Eliminar tus datos") {
                Text("Puedes borrar tu perfil, tus resultados o los baremos importados en cualquier momento desde Configuración o Mis resultados. Al desinstalar la app se elimina toda la información almacenada.")
            }
        }
        .navigationTitle("Privacidad")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack { PrivacyView() }
}

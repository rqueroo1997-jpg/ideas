import SwiftUI
import SwiftData

/// Formulario de creación/edición de perfil. Solo pide los datos necesarios
/// para calcular puntuaciones (edad, sexo, categoría) más altura/peso
/// opcionales para el resumen.
struct ProfileFormView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var existingProfile: UserProfile?
    @Binding var path: [AppRoute]

    @State private var viewModel: ProfileViewModel

    init(existingProfile: UserProfile?, path: Binding<[AppRoute]>) {
        self.existingProfile = existingProfile
        self._path = path
        self._viewModel = State(initialValue: ProfileViewModel(profile: existingProfile))
    }

    var body: some View {
        Form {
            Section("Datos básicos") {
                TextField("Nombre o alias", text: $viewModel.displayName)
                    .textInputAutocapitalization(.words)

                DatePicker("Fecha de nacimiento", selection: $viewModel.birthDate, in: ...Date(), displayedComponents: .date)

                Picker("Sexo", selection: $viewModel.sex) {
                    ForEach(Sex.allCases) { sex in
                        Text(sex.displayName).tag(sex)
                    }
                }
            }

            Section("Datos físicos (opcional)") {
                HStack {
                    Text("Altura (cm)")
                    Spacer()
                    TextField("175", text: $viewModel.heightCm)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 90)
                }
                HStack {
                    Text("Peso (kg)")
                    Spacer()
                    TextField("70", text: $viewModel.weightKg)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 90)
                }
            }

            Section("Categoría") {
                TextField("Categoría o convocatoria (opcional)", text: $viewModel.category)
                Text("Se usa para filtrar baremos específicos de una categoría o convocatoria, si los hay cargados.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Section("Pruebas habituales") {
                ForEach(viewModel.availableTests) { test in
                    Button {
                        viewModel.toggleTest(test.id)
                    } label: {
                        HStack {
                            Text(test.name)
                                .foregroundStyle(.primary)
                            Spacer()
                            if viewModel.selectedTestIds.contains(test.id) {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(Color.accentColor)
                            }
                        }
                    }
                }
                Text("Si no seleccionas ninguna, se mostrarán todas las pruebas del catálogo.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let errorMessage = viewModel.errorMessage {
                Section {
                    Text(errorMessage)
                        .foregroundStyle(Color.noAptoColor)
                }
            }

            Section {
                PrimaryButton(title: "Guardar perfil", systemImage: "checkmark.circle.fill") {
                    if viewModel.save(into: context, existing: existingProfile) != nil {
                        if path.isEmpty == false {
                            path.removeLast()
                        }
                    }
                }
                .listRowInsets(EdgeInsets())
                .padding(.vertical, 4)
            }
        }
        .navigationTitle(existingProfile == nil ? "Nuevo perfil" : "Editar perfil")
        .navigationBarTitleDisplayMode(.inline)
    }
}

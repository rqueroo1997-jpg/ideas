import SwiftUI
import SwiftData
import UniformTypeIdentifiers

/// Configuración: perfiles, gestión de baremos (con su fuente claramente
/// indicada) y privacidad.
struct SettingsView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \UserProfile.createdAt) private var profiles: [UserProfile]
    @Query private var importedFiles: [ImportedScoringTableFile]

    @Binding var path: [AppRoute]

    @State private var settingsViewModel = SettingsViewModel()
    @State private var showFileImporter = false
    @State private var selectedTable: ScoringTable?

    var body: some View {
        Form {
            Section("Perfiles") {
                ForEach(profiles) { profile in
                    Button {
                        path.append(.profileForm(profile))
                    } label: {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(profile.displayName).foregroundStyle(.primary)
                                Text("\(profile.age) años · \(profile.sex.displayName)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").foregroundStyle(.tertiary)
                        }
                    }
                }
                .onDelete(perform: deleteProfiles)

                Button {
                    path.append(.profileForm(nil))
                } label: {
                    Label("Añadir perfil", systemImage: "person.badge.plus")
                }
            }

            Section {
                ForEach(ScoringTableRepository.shared.bundledExampleTables()) { table in
                    Button {
                        selectedTable = table
                    } label: {
                        baremoRow(name: "\(table.testId.capitalized) · \(table.sex.displayName) · \(table.ageRangeId)", badge: table.source.badgeText, verified: table.source.verified)
                    }
                }
            } header: {
                Text("Baremos de ejemplo incluidos")
            } footer: {
                Text("Estos baremos son datos ficticios incluidos solo para poder probar la app. NO son tablas oficiales: sustitúyelos importando la normativa real.")
            }

            Section {
                ForEach(importedFiles) { file in
                    if let table = settingsViewModel.decode(file) {
                        Button {
                            selectedTable = table
                        } label: {
                            baremoRow(name: file.fileName, badge: file.confirmedOfficial ? "Confirmado como oficial" : "Sin confirmar", verified: file.confirmedOfficial)
                        }
                        .swipeActions {
                            Button(role: .destructive) {
                                settingsViewModel.delete(file, from: context)
                            } label: {
                                Label("Eliminar", systemImage: "trash")
                            }
                        }
                    }
                }

                Button {
                    showFileImporter = true
                } label: {
                    Label("Importar baremo (JSON)", systemImage: "square.and.arrow.down")
                }

                if let errorMessage = settingsViewModel.errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(Color.noAptoColor)
                }
            } header: {
                Text("Baremos importados")
            } footer: {
                Text("Solo marca un baremo como oficial si procede de una normativa o convocatoria que hayas verificado tú mismo.")
            }

            Section("Información") {
                NavigationLink {
                    PrivacyView()
                } label: {
                    Label("Privacidad", systemImage: "hand.raised.fill")
                }
            }
        }
        .navigationTitle("Configuración")
        .navigationBarTitleDisplayMode(.inline)
        .fileImporter(isPresented: $showFileImporter, allowedContentTypes: [.json]) { result in
            switch result {
            case .success(let url):
                settingsViewModel.importTable(from: url, context: context)
            case .failure(let error):
                settingsViewModel.errorMessage = error.localizedDescription
            }
        }
        .sheet(item: $selectedTable) { table in
            ScoringTableInfoView(table: table)
        }
    }

    private func baremoRow(name: String, badge: String, verified: Bool) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).foregroundStyle(.primary)
                Text(badge)
                    .font(.caption)
                    .foregroundStyle(verified ? Color.aptoColor : .orange)
            }
            Spacer()
            Image(systemName: "info.circle").foregroundStyle(.tertiary)
        }
    }

    private func deleteProfiles(at offsets: IndexSet) {
        for index in offsets {
            context.delete(profiles[index])
        }
    }
}

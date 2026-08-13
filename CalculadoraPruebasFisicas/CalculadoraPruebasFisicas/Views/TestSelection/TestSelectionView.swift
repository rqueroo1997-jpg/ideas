import SwiftUI
import SwiftData

/// Selección del tipo de prueba física a evaluar. El catálogo es data-driven
/// (`TestCatalogRepository`), así que añadir una prueba nueva no requiere
/// tocar esta vista.
struct TestSelectionView: View {
    @Query(sort: \UserProfile.createdAt) private var profiles: [UserProfile]

    @State var profile: UserProfile
    var calculator: CalculatorViewModel
    @Binding var path: [AppRoute]

    private var tests: [PhysicalTestDefinition] {
        let all = TestCatalogRepository.shared.allTests()
        guard !profile.selectedTestIds.isEmpty else { return all }
        return all.filter { profile.selectedTestIds.contains($0.id) }
    }

    var body: some View {
        List {
            if profiles.count > 1 {
                Section("Perfil") {
                    Picker("Perfil", selection: $profile) {
                        ForEach(profiles) { candidate in
                            Text(candidate.displayName).tag(candidate)
                        }
                    }
                }
            }

            Section("Selecciona una prueba") {
                ForEach(tests) { test in
                    let result = calculator.result(for: test.id)
                    Button {
                        path.append(.testEntry(profile: profile, test: test, calculator: calculator))
                    } label: {
                        TestCard(test: test, scoreLabel: result?.scoreLabel, isApto: result?.isApto)
                    }
                    .buttonStyle(.plain)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                    .padding(.vertical, 4)
                }
            }

            if !calculator.results.isEmpty {
                Section {
                    PrimaryButton(title: "Ver resultado final", systemImage: "flag.checkered.2.crossed") {
                        path.append(.finalResult(profile: profile, calculator: calculator))
                    }
                    .listRowInsets(EdgeInsets())
                }
            }
        }
        .listStyle(.plain)
        .navigationTitle("Calculadora")
        .navigationBarTitleDisplayMode(.inline)
    }
}

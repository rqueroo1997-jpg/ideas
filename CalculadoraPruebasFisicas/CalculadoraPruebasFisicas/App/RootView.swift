import SwiftUI

/// Contenedor de navegación raíz de la app. Toda la navegación pasa por un
/// único `NavigationStack`, lo que facilita razonar sobre el flujo completo
/// (Inicio -> Selección de prueba -> Introducción de marca -> Resultado...).
struct RootView: View {
    @State private var path: [AppRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            HomeView(path: $path)
                .navigationDestination(for: AppRoute.self) { route in
                    destination(for: route)
                }
        }
    }

    @ViewBuilder
    private func destination(for route: AppRoute) -> some View {
        switch route {
        case .profileForm(let profile):
            ProfileFormView(existingProfile: profile, path: $path)
        case .testSelection(let profile, let calculator):
            TestSelectionView(profile: profile, calculator: calculator, path: $path)
        case .testEntry(let profile, let test, let calculator):
            TestEntryView(profile: profile, test: test, calculator: calculator, path: $path)
        case .finalResult(let profile, let calculator):
            FinalResultView(profile: profile, calculator: calculator, path: $path)
        case .history:
            HistoryView(path: $path)
        case .historyDetail(let session):
            HistoryDetailView(session: session)
        case .settings:
            SettingsView(path: $path)
        case .privacy:
            PrivacyView()
        case .training(let profile):
            TrainingModeView(profile: profile)
        }
    }
}

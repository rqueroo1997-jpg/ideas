import Foundation

/// Destinos de navegación de la app. Un único `NavigationStack` en `RootView`
/// resuelve todas las pantallas a partir de este enum, en lugar de repartir
/// la navegación entre múltiples stacks independientes.
enum AppRoute: Hashable {
    case profileForm(UserProfile?)
    case testSelection(profile: UserProfile, calculator: CalculatorViewModel)
    case testEntry(profile: UserProfile, test: PhysicalTestDefinition, calculator: CalculatorViewModel)
    case finalResult(profile: UserProfile, calculator: CalculatorViewModel)
    case history
    case historyDetail(TestSession)
    case settings
    case privacy
    case training(UserProfile)
}

import SwiftUI
import SwiftData

@main
struct CalculadoraPruebasFisicasApp: App {
    let modelContainer = PersistenceController.makeContainer()

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(modelContainer)
    }
}

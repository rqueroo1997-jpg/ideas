import SwiftUI
import SwiftData

/// Pantalla de inicio: nombre de la app, accesos principales, último
/// resultado y estado APTO/NO APTO.
struct HomeView: View {
    @Query(sort: \UserProfile.createdAt, order: .reverse) private var profiles: [UserProfile]
    @Query(sort: \TestSession.date, order: .reverse) private var sessions: [TestSession]

    @Binding var path: [AppRoute]

    private var activeProfile: UserProfile? { profiles.first }
    private var lastSession: TestSession? { sessions.first }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                header

                if let lastSession {
                    lastResultCard(lastSession)
                }

                actions

                if activeProfile == nil {
                    Text("Crea tu perfil para poder calcular puntuaciones.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .padding()
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let activeProfile {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        path.append(.profileForm(activeProfile))
                    } label: {
                        Image(systemName: "person.crop.circle")
                    }
                    .accessibilityLabel("Editar perfil")
                }
            }
        }
    }

    private var header: some View {
        VStack(spacing: 6) {
            Image(systemName: "figure.run.square.stack.fill")
                .font(.system(size: 44))
                .foregroundStyle(Color.accentColor)
            Text("Calculadora Pruebas Físicas")
                .font(.largeTitle.bold())
                .multilineTextAlignment(.center)
            if let activeProfile {
                Text("\(activeProfile.displayName) · \(activeProfile.age) años")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.top, 12)
    }

    private var actions: some View {
        VStack(spacing: 14) {
            PrimaryButton(title: "Nueva prueba", systemImage: "plus.circle.fill") {
                if let activeProfile {
                    path.append(.testSelection(profile: activeProfile, calculator: CalculatorViewModel()))
                } else {
                    path.append(.profileForm(nil))
                }
            }
            PrimaryButton(title: "Mis resultados", systemImage: "chart.bar.fill", kind: .secondary) {
                path.append(.history)
            }
            PrimaryButton(title: "Configuración", systemImage: "gearshape.fill", kind: .secondary) {
                path.append(.settings)
            }
            if let activeProfile {
                PrimaryButton(title: "Modo entrenamiento", systemImage: "figure.strengthtraining.functional", kind: .secondary) {
                    path.append(.training(activeProfile))
                }
            }
        }
    }

    private func lastResultCard(_ session: TestSession) -> some View {
        Button {
            path.append(.historyDetail(session))
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                Text("Último resultado")
                    .font(.headline)
                    .foregroundStyle(.primary)

                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(Formatters.date(session.date))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("\(Formatters.decimal(session.totalScore)) / \(Formatters.decimal(session.maxPossibleScore))")
                            .font(.title2.bold())
                    }
                    Spacer()
                    StatusIndicator(isApto: session.isApto)
                }
            }
            .cardStyle()
        }
        .buttonStyle(.plain)
    }
}

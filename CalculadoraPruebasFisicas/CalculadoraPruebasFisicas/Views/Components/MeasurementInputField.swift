import SwiftUI

/// Campo de introducción de marca genérico: cambia de forma según el tipo de
/// magnitud de la prueba (tiempo, distancia, repeticiones...), lo que permite
/// reutilizar una única pantalla de introducción para todas las pruebas.
struct MeasurementInputField: View {
    var kind: MeasurementKind
    var unitLabel: String

    @Binding var minutes: Int
    @Binding var seconds: Int
    @Binding var centiseconds: Int
    @Binding var numericValue: String

    var body: some View {
        switch kind {
        case .time:
            HStack(spacing: 12) {
                timeComponentField(value: $minutes, label: "min")
                Text(":").font(.title.bold()).foregroundStyle(.secondary)
                timeComponentField(value: $seconds, label: "seg")
                Text(",").font(.title.bold()).foregroundStyle(.secondary)
                timeComponentField(value: $centiseconds, label: "cent")
            }
        case .distanceMeters, .repetitions, .count, .points:
            VStack(spacing: 6) {
                TextField("0", text: $numericValue)
                    .keyboardType(.decimalPad)
                    .font(.system(size: 40, weight: .semibold, design: .rounded))
                    .multilineTextAlignment(.center)
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                Text(unitLabel)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func timeComponentField(value: Binding<Int>, label: String) -> some View {
        VStack(spacing: 4) {
            TextField("0", value: value, format: .number)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .font(.system(size: 30, weight: .semibold, design: .rounded))
                .frame(width: 64)
                .padding(10)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

private struct MeasurementInputFieldPreview: View {
    @State var minutes = 3
    @State var seconds = 52
    @State var centiseconds = 0
    @State var numeric = "35"

    var body: some View {
        VStack(spacing: 30) {
            MeasurementInputField(kind: .time, unitLabel: "min:seg,cent", minutes: $minutes, seconds: $seconds, centiseconds: $centiseconds, numericValue: $numeric)
            MeasurementInputField(kind: .repetitions, unitLabel: "repeticiones", minutes: $minutes, seconds: $seconds, centiseconds: $centiseconds, numericValue: $numeric)
        }
        .padding()
    }
}

#Preview {
    MeasurementInputFieldPreview()
}

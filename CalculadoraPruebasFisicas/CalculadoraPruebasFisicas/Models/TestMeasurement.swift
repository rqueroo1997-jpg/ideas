import Foundation

/// Representa la marca introducida por el usuario para una prueba concreta.
///
/// `value` es siempre la magnitud normalizada usada para comparar contra los
/// baremos (segundos para tiempo, metros para distancia, repeticiones para
/// conteos...). `displayText` es la representación legible que se muestra en
/// pantalla (p.ej. "03:52" para un tiempo).
struct TestMeasurement: Codable, Hashable {
    var value: Double
    var displayText: String

    static func time(minutes: Int, seconds: Int, centiseconds: Int) -> TestMeasurement {
        let totalSeconds = Double(minutes) * 60 + Double(seconds) + Double(centiseconds) / 100
        let display: String
        if centiseconds == 0 {
            display = String(format: "%02d:%02d", minutes, seconds)
        } else {
            display = String(format: "%02d:%02d,%02d", minutes, seconds, centiseconds)
        }
        return TestMeasurement(value: totalSeconds, displayText: display)
    }

    static func plain(_ value: Double, suffix: String = "") -> TestMeasurement {
        let formatted = Formatters.decimal(value)
        return TestMeasurement(value: value, displayText: suffix.isEmpty ? formatted : "\(formatted) \(suffix)")
    }
}

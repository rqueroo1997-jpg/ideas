import Foundation

/// Formateadores centralizados para que toda la app muestre números y fechas
/// de forma consistente (coma decimal en español, p.ej. "8,5").
enum Formatters {
    static let decimalFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = 2
        return formatter
    }()

    static let mediumDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()

    static let shortDateTimeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_ES")
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter
    }()

    /// Formatea un número con coma decimal, sin decimales innecesarios (p.ej. 10 -> "10", 8.5 -> "8,5").
    static func decimal(_ value: Double) -> String {
        decimalFormatter.string(from: NSNumber(value: value)) ?? String(format: "%.1f", value)
    }

    static func date(_ date: Date) -> String {
        mediumDateFormatter.string(from: date)
    }

    static func dateTime(_ date: Date) -> String {
        shortDateTimeFormatter.string(from: date)
    }

    /// Convierte segundos totales a una cadena "mm:ss" o "mm:ss,cc".
    ///
    /// Se redondea una única vez a centésimas totales (en lugar de restar
    /// partes fraccionarias de un Double varias veces) para evitar errores
    /// de precisión de coma flotante en el último dígito.
    static func timeFromSeconds(_ totalSeconds: Double) -> String {
        let totalCentiseconds = Int((totalSeconds * 100).rounded())
        let minutes = totalCentiseconds / 6000
        let seconds = (totalCentiseconds / 100) % 60
        let centiseconds = totalCentiseconds % 100
        if centiseconds == 0 {
            return String(format: "%02d:%02d", minutes, seconds)
        }
        return String(format: "%02d:%02d,%02d", minutes, seconds, centiseconds)
    }
}

import Foundation

/// Error de validación con mensaje ya listo para mostrar al usuario.
struct ValidationError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

/// Validaciones de entrada centralizadas. Ninguna vista debe validar datos
/// "a mano": todas usan estas funciones para mantener las mismas reglas y
/// los mismos mensajes de error en toda la app.
enum Validators {

    static func validateName(_ name: String) throws {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw ValidationError(message: "Introduce un nombre o alias.")
        }
        guard trimmed.count <= 60 else {
            throw ValidationError(message: "El nombre es demasiado largo (máximo 60 caracteres).")
        }
    }

    static func validateBirthDate(_ date: Date) throws {
        let age = Calendar.current.dateComponents([.year], from: date, to: Date()).year ?? 0
        guard date <= Date() else {
            throw ValidationError(message: "La fecha de nacimiento no puede ser futura.")
        }
        guard age >= 14, age <= 80 else {
            throw ValidationError(message: "La edad calculada (\(age) años) está fuera de un rango razonable (14-80).")
        }
    }

    static func validateHeight(_ cm: Double?) throws {
        guard let cm else { return }
        guard cm >= 100, cm <= 230 else {
            throw ValidationError(message: "La altura debe estar entre 100 y 230 cm.")
        }
    }

    static func validateWeight(_ kg: Double?) throws {
        guard let kg else { return }
        guard kg >= 30, kg <= 250 else {
            throw ValidationError(message: "El peso debe estar entre 30 y 250 kg.")
        }
    }

    /// Valida los componentes de un tiempo (minutos, segundos, centésimas).
    static func validateTime(minutes: Int, seconds: Int, centiseconds: Int) throws {
        guard minutes >= 0, minutes <= 120 else {
            throw ValidationError(message: "Los minutos deben estar entre 0 y 120.")
        }
        guard seconds >= 0, seconds <= 59 else {
            throw ValidationError(message: "Los segundos deben estar entre 0 y 59.")
        }
        guard centiseconds >= 0, centiseconds <= 99 else {
            throw ValidationError(message: "Las centésimas deben estar entre 0 y 99.")
        }
        guard minutes > 0 || seconds > 0 || centiseconds > 0 else {
            throw ValidationError(message: "Introduce un tiempo mayor que cero.")
        }
    }

    /// Valida una magnitud numérica genérica (distancia, repeticiones, conteos).
    static func validatePositiveMeasurement(_ value: Double, kind: MeasurementKind) throws {
        guard value.isFinite else {
            throw ValidationError(message: "El valor introducido no es un número válido.")
        }
        guard value >= 0 else {
            throw ValidationError(message: "El valor no puede ser negativo.")
        }
        switch kind {
        case .distanceMeters:
            guard value <= 100_000 else {
                throw ValidationError(message: "La distancia introducida es demasiado grande.")
            }
        case .repetitions, .count:
            guard value == value.rounded() else {
                throw ValidationError(message: "Introduce un número entero de repeticiones.")
            }
            guard value <= 5000 else {
                throw ValidationError(message: "El número de repeticiones introducido es demasiado grande.")
            }
        case .points:
            guard value <= 1000 else {
                throw ValidationError(message: "La puntuación introducida es demasiado grande.")
            }
        case .time:
            break
        }
    }
}

import Foundation
import SwiftData

/// Perfil del usuario. Solo guarda los datos estrictamente necesarios para
/// poder seleccionar el baremo correcto (edad, sexo, categoría) y mostrar un
/// resumen físico opcional. Todo se almacena localmente mediante SwiftData.
@Model
final class UserProfile {
    var id: UUID = UUID()
    var displayName: String = ""
    var birthDate: Date = Date()
    var sex: Sex = Sex.male
    /// Altura en centímetros. Opcional: no es necesaria para calcular puntuaciones.
    var heightCm: Double?
    /// Peso en kilogramos. Opcional.
    var weightKg: Double?
    /// Categoría/convocatoria a la que pertenece (usada para filtrar baremos).
    var category: String?
    /// Identificadores de `PhysicalTestDefinition` que este perfil suele evaluar.
    var selectedTestIds: [String] = []
    var createdAt: Date = Date()

    init(
        displayName: String,
        birthDate: Date,
        sex: Sex,
        heightCm: Double? = nil,
        weightKg: Double? = nil,
        category: String? = nil,
        selectedTestIds: [String] = []
    ) {
        self.id = UUID()
        self.displayName = displayName
        self.birthDate = birthDate
        self.sex = sex
        self.heightCm = heightCm
        self.weightKg = weightKg
        self.category = category
        self.selectedTestIds = selectedTestIds
        self.createdAt = Date()
    }

    /// Edad calculada a fecha de hoy a partir de la fecha de nacimiento.
    var age: Int {
        Calendar.current.dateComponents([.year], from: birthDate, to: Date()).year ?? 0
    }
}

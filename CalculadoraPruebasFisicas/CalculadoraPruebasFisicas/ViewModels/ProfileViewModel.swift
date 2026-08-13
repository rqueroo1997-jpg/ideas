import Foundation
import Observation
import SwiftData

/// Estado y validación del formulario de perfil. No pide más datos de los
/// necesarios para seleccionar el baremo correcto y mostrar un resumen.
@Observable
final class ProfileViewModel {
    var displayName: String = ""
    var birthDate: Date = Calendar.current.date(byAdding: .year, value: -25, to: Date()) ?? Date()
    var sex: Sex = .male
    var heightCm: String = ""
    var weightKg: String = ""
    var category: String = ""
    var selectedTestIds: Set<String> = []
    var errorMessage: String?

    let availableTests: [PhysicalTestDefinition]

    init(profile: UserProfile? = nil, availableTests: [PhysicalTestDefinition] = TestCatalogRepository.shared.allTests()) {
        self.availableTests = availableTests
        guard let profile else { return }
        displayName = profile.displayName
        birthDate = profile.birthDate
        sex = profile.sex
        heightCm = profile.heightCm.map(Formatters.decimal) ?? ""
        weightKg = profile.weightKg.map(Formatters.decimal) ?? ""
        category = profile.category ?? ""
        selectedTestIds = Set(profile.selectedTestIds)
    }

    func toggleTest(_ id: String) {
        if selectedTestIds.contains(id) {
            selectedTestIds.remove(id)
        } else {
            selectedTestIds.insert(id)
        }
    }

    /// Valida el formulario y guarda (crea o actualiza) el perfil en SwiftData.
    /// Devuelve el perfil guardado, o `nil` si la validación falla (ver `errorMessage`).
    @discardableResult
    func save(into context: ModelContext, existing: UserProfile?) -> UserProfile? {
        errorMessage = nil
        do {
            try Validators.validateName(displayName)
            try Validators.validateBirthDate(birthDate)
            let height = parsedDouble(heightCm)
            let weight = parsedDouble(weightKg)
            try Validators.validateHeight(height)
            try Validators.validateWeight(weight)

            let trimmedName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedCategory = category.trimmingCharacters(in: .whitespacesAndNewlines)

            if let existing {
                existing.displayName = trimmedName
                existing.birthDate = birthDate
                existing.sex = sex
                existing.heightCm = height
                existing.weightKg = weight
                existing.category = trimmedCategory.isEmpty ? nil : trimmedCategory
                existing.selectedTestIds = Array(selectedTestIds)
                return existing
            }

            let profile = UserProfile(
                displayName: trimmedName,
                birthDate: birthDate,
                sex: sex,
                heightCm: height,
                weightKg: weight,
                category: trimmedCategory.isEmpty ? nil : trimmedCategory,
                selectedTestIds: Array(selectedTestIds)
            )
            context.insert(profile)
            return profile
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    private func parsedDouble(_ text: String) -> Double? {
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return nil }
        return Double(trimmed.replacingOccurrences(of: ",", with: "."))
    }
}

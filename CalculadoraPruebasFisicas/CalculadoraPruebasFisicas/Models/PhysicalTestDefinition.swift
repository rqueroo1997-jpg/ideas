import Foundation

/// Definición de una prueba física dentro del catálogo de la app.
///
/// El catálogo completo se carga desde `tests_catalog.json` (ver
/// `Data/TestCatalog`), por lo que añadir una prueba nueva NO requiere tocar
/// el resto de la aplicación: basta con añadir una entrada al JSON y, si se
/// quiere que puntúe, su baremo correspondiente.
struct PhysicalTestDefinition: Codable, Identifiable, Hashable {
    /// Identificador estable usado para enlazar con los baremos (p.ej. "carrera").
    var id: String
    var name: String
    /// Nombre de SF Symbol para representar la prueba en tarjetas y listas.
    var icon: String
    var measurementKind: MeasurementKind
    /// Etiqueta de la unidad mostrada al usuario (p.ej. "min:seg:cent", "metros").
    var unitLabel: String
    /// true si una marca menor es mejor (tiempos), false si mayor es mejor
    /// (repeticiones, distancia, etc.).
    var lowerIsBetter: Bool
    /// Orden de presentación en las listas de selección.
    var order: Int
    /// Texto breve de ayuda mostrado en el formulario de introducción de marca.
    var helpText: String?
}

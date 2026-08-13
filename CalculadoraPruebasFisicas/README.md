# Calculadora Pruebas Físicas

App nativa para iPhone/iPad (Swift + SwiftUI + SwiftData) para introducir marcas de
pruebas físicas, calcular la puntuación según un baremo configurable y llevar un
historial de resultados con su evolución.

Todos los datos se guardan **solo en el dispositivo** (SwiftData). No hay servidor
ni cuenta de usuario en esta versión.

## ⚠️ Importante: los baremos incluidos son de EJEMPLO, no oficiales

Los baremos incluidos en `CalculadoraPruebasFisicas/Data/Baremos/Ejemplo/` son
**datos ficticios** creados únicamente para que la app compile, se pueda probar y
tenga tests unitarios. Están marcados explícitamente como no oficiales
(`"verified": false`, `"origin": "training"`) y así se muestran en la interfaz
(Configuración → Baremos, y en "Fuente del baremo" dentro de cada resultado).

**No se ha inventado ninguna tabla de puntuación real.** Antes de usar la app para
una evaluación real hace falta la normativa oficial — ver la sección
["Qué necesito que me proporciones"](#qué-necesito-que-me-proporciones) más abajo.

## Requisitos

- macOS con Xcode 16 o superior.
- iOS 17.0 o superior como destino (usa `@Observable`, SwiftData, `NavigationStack`
  y Swift Charts, todos disponibles desde iOS 17).
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) para generar el `.xcodeproj`
  (el proyecto no se versiona directamente en el repositorio; se genera a partir
  de `project.yml`, que es la fuente de verdad).

## Cómo abrir el proyecto

```bash
brew install xcodegen   # si no lo tienes instalado
cd CalculadoraPruebasFisicas
xcodegen generate
open CalculadoraPruebasFisicas.xcodeproj
```

Selecciona el esquema `CalculadoraPruebasFisicas`, un simulador de iPhone o iPad, y
pulsa Run (⌘R).

## Cómo ejecutar los tests

Desde Xcode: ⌘U con el esquema `CalculadoraPruebasFisicas`.

Desde terminal:

```bash
xcodebuild test \
  -project CalculadoraPruebasFisicas.xcodeproj \
  -scheme CalculadoraPruebasFisicas \
  -destination 'platform=iOS Simulator,name=iPhone 16'
```

Los tests cubren: cálculo de puntuaciones (`ScoringServiceTests`), coincidencia y
decodificación de baremos (`ScoringTableTests`), validaciones de entrada
(`ValidatorsTests`) y formateo (`FormattersTests`) — incluyendo límites de tramos,
edades en el borde del rango, sexo/categoría no coincidentes, datos incorrectos y
tablas mal formadas.

## Estructura del proyecto

```
CalculadoraPruebasFisicas/
  project.yml                  # Definición del proyecto para XcodeGen
  CalculadoraPruebasFisicas/
    App/                       # Punto de entrada, navegación raíz (NavigationStack)
    Models/                    # PhysicalTestDefinition, ScoringTable, UserProfile...
    Views/                     # Pantallas y componentes reutilizables, por SwiftUI
    ViewModels/                # Estado y lógica de cada pantalla (sin SwiftUI)
    Services/                  # ScoringService, import/export, persistencia
    Data/                      # Catálogo de pruebas y baremos (JSON) + repositorios
    Utilities/                 # Formatters, Validators, Extensions
    Resources/                 # Assets.xcassets
  CalculadoraPruebasFisicasTests/
```

### Arquitectura

- **Vistas** (`Views/`) no contienen lógica de cálculo: solo presentan estado y
  llaman a los `ViewModels`.
- **ViewModels** (`ViewModels/`) coordinan flujo y validación, y llaman a los
  `Services`. Usan `@Observable` (Observation framework).
- **`ScoringService`** es el único responsable de calcular puntuaciones. Es una
  clase sin dependencias de SwiftUI/SwiftData, fácil de testear de forma aislada.
- **Baremos separados del código**: `ScoringTable` se decodifica desde JSON
  (`Data/Baremos/Ejemplo/*.json` para los de ejemplo, o desde archivos importados
  por el usuario en Configuración). Añadir o corregir un baremo no requiere
  recompilar la app.
- **Catálogo de pruebas data-driven**: `Data/TestCatalog/tests_catalog.json`
  define las 8 pruebas del enunciado (Carrera, Velocidad, Resistencia, Fuerza,
  Abdominales, Flexiones, Salto, Natación). Añadir una prueba nueva consiste en
  añadir una entrada a ese JSON (y, si debe puntuar, su baremo correspondiente):
  no hace falta tocar ninguna vista.

### Formato de un archivo de baremo (JSON)

```json
{
  "testId": "carrera",
  "sex": "hombre",
  "ageRangeId": "20-24",
  "ageMin": 20,
  "ageMax": 24,
  "category": null,
  "passingScore": 5,
  "ranges": [
    { "minimum": 0, "maximum": 225, "score": 10 },
    { "minimum": 226, "maximum": 240, "score": 8 }
  ],
  "source": {
    "name": "Nombre exacto de la normativa",
    "callNumber": "Convocatoria a la que pertenece (si aplica)",
    "publishedDate": "2024-01-15T00:00:00Z",
    "reference": "BOE / orden ministerial / documento de origen",
    "lastUpdated": "2024-01-15T00:00:00Z",
    "verified": true,
    "origin": "official"
  }
}
```

- `minimum`/`maximum` son la marca normalizada (segundos para tiempo, metros para
  distancia, repeticiones para conteos).
- Un baremo solo debe llevar `"verified": true` y `"origin": "official"` cuando
  proceda de una normativa real confirmada. Los baremos importados desde
  Configuración nunca se marcan como oficiales automáticamente: lo confirma el
  usuario explícitamente tras revisar la fuente.

Los baremos se importan desde **Configuración → Baremos importados → Importar
baremo (JSON)**, seleccionando un archivo con este formato.

## Qué necesito que me proporciones

Para poder cargar baremos **reales** (y no los de ejemplo) necesito, para cada
prueba que quieras evaluar:

1. **Nombre exacto de la normativa o convocatoria** (y, si aplica, número de
   convocatoria/año) — para rellenar "Fuente del baremo".
2. **Fecha de publicación** y **referencia/fuente** (BOE, orden ministerial,
   enlace al documento, etc.) para poder marcarlo como oficial verificado.
3. **Qué pruebas exactas** se evalúan (confirmar si son las 8 del catálogo actual
   —Carrera, Velocidad, Resistencia, Fuerza, Abdominales, Flexiones, Salto,
   Natación— o si hay que añadir/quitar alguna, y con qué unidad exacta se mide
   cada una).
4. **Las tablas de puntuación completas**, por tramo de marca, para cada
   combinación de:
   - Prueba
   - Sexo (hombre/mujer)
   - Rango de edad
   - Categoría o convocatoria, si hay varias
5. **La puntuación mínima para considerar APTO**, por prueba y/o en el total.

Con esos datos puedo generar los archivos JSON reales (con el mismo formato de
arriba) y sustituir o complementar los baremos de ejemplo, dejándolos ya marcados
como oficiales y verificados.

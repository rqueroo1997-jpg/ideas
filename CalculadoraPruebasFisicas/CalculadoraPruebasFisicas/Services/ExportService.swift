import Foundation
import UIKit

/// Genera los archivos que se comparten mediante las herramientas nativas de
/// iOS (`ShareLink` / `UIActivityViewController`). No sube nada a ningún
/// servidor: todo el archivo se genera y se comparte localmente.
struct ExportService {

    /// Genera un PDF de una página con el resumen del resultado final.
    func generatePDF(profileName: String, date: Date, result: FinalResult) -> Data {
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)

        return renderer.pdfData { context in
            context.beginPage()

            var y: CGFloat = 40
            let titleAttrs: [NSAttributedString.Key: Any] = [.font: UIFont.boldSystemFont(ofSize: 22)]
            "Resultado - Calculadora Pruebas Físicas".draw(at: CGPoint(x: 40, y: y), withAttributes: titleAttrs)
            y += 34

            let subAttrs: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 13)]
            "\(profileName) · \(Formatters.dateTime(date))".draw(at: CGPoint(x: 40, y: y), withAttributes: subAttrs)
            y += 30

            let headerAttrs: [NSAttributedString.Key: Any] = [.font: UIFont.boldSystemFont(ofSize: 14)]
            for item in result.results {
                item.test.name.draw(at: CGPoint(x: 40, y: y), withAttributes: headerAttrs)
                let statusText = item.isApto ? "APTO" : "NO APTO"
                let scoreLine = "\(item.mark.displayText)   →   \(item.scoreLabel)   [\(statusText)]"
                scoreLine.draw(at: CGPoint(x: 260, y: y), withAttributes: subAttrs)
                y += 24
            }

            y += 14
            let totalAttrs: [NSAttributedString.Key: Any] = [.font: UIFont.boldSystemFont(ofSize: 18)]
            "TOTAL: \(Formatters.decimal(result.totalScore)) / \(Formatters.decimal(result.maxPossibleScore))"
                .draw(at: CGPoint(x: 40, y: y), withAttributes: totalAttrs)
            y += 28

            let statusColor: UIColor = result.isApto ? .systemGreen : .systemRed
            let statusAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 20),
                .foregroundColor: statusColor
            ]
            (result.isApto ? "APTO" : "NO APTO").draw(at: CGPoint(x: 40, y: y), withAttributes: statusAttrs)

            y += 40
            let footerAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.italicSystemFont(ofSize: 10),
                .foregroundColor: UIColor.secondaryLabel
            ]
            "Generado localmente por Calculadora Pruebas Físicas. Comprueba la fuente de cada baremo en Configuración."
                .draw(in: CGRect(x: 40, y: y, width: pageRect.width - 80, height: 40), withAttributes: footerAttrs)
        }
    }

    /// Escribe el PDF en un archivo temporal para poder compartirlo.
    func writeTemporaryPDF(data: Data, suggestedName: String) throws -> URL {
        let safeName = suggestedName.replacingOccurrences(of: "/", with: "-")
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(safeName)
            .appendingPathExtension("pdf")
        try data.write(to: url, options: .atomic)
        return url
    }
}

import SwiftUI
import UIKit

/// Envoltorio de `UIActivityViewController` para compartir PDFs/imágenes con
/// las herramientas nativas de iOS.
struct ShareSheet: UIViewControllerRepresentable {
    var activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

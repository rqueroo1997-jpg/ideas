import XCTest
@testable import CalculadoraPruebasFisicas

final class ScoringTableTests: XCTestCase {

    private func makeSource() -> ScoringSource {
        ScoringSource(name: "Tabla de pruebas", callNumber: nil, publishedDate: nil, reference: nil, lastUpdated: Date(), verified: false, origin: .training)
    }

    private func makeTable(ageMin: Int, ageMax: Int, sex: Sex, category: String?) -> ScoringTable {
        ScoringTable(
            testId: "carrera", sex: sex, ageRangeId: "\(ageMin)-\(ageMax)",
            ageMin: ageMin, ageMax: ageMax, category: category,
            passingScore: 5, ranges: [ScoreRange(minimum: 0, maximum: 100, score: 10)], source: makeSource()
        )
    }

    // MARK: - matches(age:sex:category:)

    func testMatches_ageAtLowerBoundary_isIncluded() {
        let table = makeTable(ageMin: 18, ageMax: 24, sex: .male, category: nil)
        XCTAssertTrue(table.matches(age: 18, sex: .male, category: nil))
    }

    func testMatches_ageAtUpperBoundary_isIncluded() {
        let table = makeTable(ageMin: 18, ageMax: 24, sex: .male, category: nil)
        XCTAssertTrue(table.matches(age: 24, sex: .male, category: nil))
    }

    func testMatches_ageJustBelowLowerBoundary_isExcluded() {
        let table = makeTable(ageMin: 18, ageMax: 24, sex: .male, category: nil)
        XCTAssertFalse(table.matches(age: 17, sex: .male, category: nil))
    }

    func testMatches_ageJustAboveUpperBoundary_isExcluded() {
        let table = makeTable(ageMin: 18, ageMax: 24, sex: .male, category: nil)
        XCTAssertFalse(table.matches(age: 25, sex: .male, category: nil))
    }

    func testMatches_differentSex_isExcluded() {
        let table = makeTable(ageMin: 18, ageMax: 24, sex: .male, category: nil)
        XCTAssertFalse(table.matches(age: 20, sex: .female, category: nil))
    }

    func testMatches_tableWithoutCategory_appliesToAnyProfileCategory() {
        let table = makeTable(ageMin: 18, ageMax: 24, sex: .male, category: nil)
        XCTAssertTrue(table.matches(age: 20, sex: .male, category: "Cualquiera"))
        XCTAssertTrue(table.matches(age: 20, sex: .male, category: nil))
    }

    func testMatches_tableWithCategory_requiresExactCategoryMatch() {
        let table = makeTable(ageMin: 18, ageMax: 24, sex: .male, category: "Élite")
        XCTAssertTrue(table.matches(age: 20, sex: .male, category: "Élite"))
        XCTAssertFalse(table.matches(age: 20, sex: .male, category: "General"))
        XCTAssertFalse(table.matches(age: 20, sex: .male, category: nil))
    }

    // MARK: - Decodificación desde JSON (formato de baremo importable)

    func testDecode_validJSON_producesExpectedTable() throws {
        let json = """
        {
          "testId": "flexiones",
          "sex": "hombre",
          "ageRangeId": "18-24",
          "ageMin": 18,
          "ageMax": 24,
          "category": null,
          "passingScore": 5,
          "ranges": [
            { "minimum": 0, "maximum": 9, "score": 0 },
            { "minimum": 10, "maximum": 9999, "score": 10 }
          ],
          "source": {
            "name": "EJEMPLO - Datos ficticios",
            "callNumber": null,
            "publishedDate": null,
            "reference": null,
            "lastUpdated": "2026-01-01T00:00:00Z",
            "verified": false,
            "origin": "training"
          }
        }
        """
        let table = try ScoringTableRepository.decode(Data(json.utf8))
        XCTAssertEqual(table.testId, "flexiones")
        XCTAssertEqual(table.sex, .male)
        XCTAssertEqual(table.ranges.count, 2)
        XCTAssertFalse(table.source.verified)
        XCTAssertEqual(table.source.origin, .training)
    }

    func testDecode_missingRequiredField_throws() {
        let json = """
        { "testId": "flexiones", "sex": "hombre" }
        """
        XCTAssertThrowsError(try ScoringTableRepository.decode(Data(json.utf8)))
    }

    func testDecode_invalidSexValue_throws() {
        let json = """
        {
          "testId": "flexiones", "sex": "invalido", "ageRangeId": "18-24",
          "ageMin": 18, "ageMax": 24, "category": null, "passingScore": 5,
          "ranges": [], "source": {
            "name": "x", "callNumber": null, "publishedDate": null, "reference": null,
            "lastUpdated": "2026-01-01T00:00:00Z", "verified": false, "origin": "training"
          }
        }
        """
        XCTAssertThrowsError(try ScoringTableRepository.decode(Data(json.utf8)))
    }
}

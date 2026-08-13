import XCTest
@testable import CalculadoraPruebasFisicas

final class ScoringServiceTests: XCTestCase {

    private let carrera = PhysicalTestDefinition(
        id: "carrera", name: "Carrera", icon: "figure.run",
        measurementKind: .time, unitLabel: "min:seg", lowerIsBetter: true, order: 1, helpText: nil
    )

    private func makeSource(verified: Bool = false, origin: BaremoOrigin = .training) -> ScoringSource {
        ScoringSource(name: "Tabla de pruebas", callNumber: nil, publishedDate: nil, reference: nil, lastUpdated: Date(), verified: verified, origin: origin)
    }

    private func makeTable(
        testId: String = "carrera",
        sex: Sex = .male,
        ageMin: Int = 18,
        ageMax: Int = 24,
        category: String? = nil,
        passingScore: Double = 5,
        ranges: [ScoreRange]
    ) -> ScoringTable {
        ScoringTable(
            testId: testId, sex: sex, ageRangeId: "\(ageMin)-\(ageMax)",
            ageMin: ageMin, ageMax: ageMax, category: category,
            passingScore: passingScore, ranges: ranges, source: makeSource()
        )
    }

    private let standardRanges: [ScoreRange] = [
        ScoreRange(minimum: 0, maximum: 100, score: 10),
        ScoreRange(minimum: 101, maximum: 200, score: 8),
        ScoreRange(minimum: 201, maximum: 300, score: 6),
        ScoreRange(minimum: 301, maximum: 400, score: 4),
        ScoreRange(minimum: 401, maximum: 500, score: 2)
    ]

    // MARK: - Búsqueda de tramo (lookupScore)

    func testLookupScore_exactRangeMatch() {
        let table = makeTable(ranges: standardRanges)
        XCTAssertEqual(ScoringService.lookupScore(mark: 150, in: table), 8)
    }

    func testLookupScore_lowerBoundaryIsInclusive() {
        let table = makeTable(ranges: standardRanges)
        XCTAssertEqual(ScoringService.lookupScore(mark: 101, in: table), 8)
    }

    func testLookupScore_upperBoundaryIsInclusive() {
        let table = makeTable(ranges: standardRanges)
        XCTAssertEqual(ScoringService.lookupScore(mark: 100, in: table), 10)
    }

    func testLookupScore_belowLowestBracket_usesLowestBracketScore() {
        let ranges = [ScoreRange(minimum: 50, maximum: 100, score: 10)]
        let table = makeTable(ranges: ranges)
        XCTAssertEqual(ScoringService.lookupScore(mark: 0, in: table), 10)
    }

    func testLookupScore_aboveHighestBracket_usesLastBracketScore() {
        let table = makeTable(ranges: standardRanges)
        XCTAssertEqual(ScoringService.lookupScore(mark: 9999, in: table), 2)
    }

    func testLookupScore_gapBetweenBrackets_usesLastAppliedThreshold() {
        // Tabla mal formada a propósito: falta el tramo 101-150.
        let ranges = [
            ScoreRange(minimum: 0, maximum: 100, score: 10),
            ScoreRange(minimum: 151, maximum: 200, score: 8)
        ]
        let table = makeTable(ranges: ranges)
        XCTAssertEqual(ScoringService.lookupScore(mark: 120, in: table), 10)
    }

    func testLookupScore_emptyRanges_returnsZero() {
        let table = makeTable(ranges: [])
        XCTAssertEqual(ScoringService.lookupScore(mark: 50, in: table), 0)
    }

    // MARK: - score(test:mark:age:sex:category:tables:)

    func testScore_noMatchingTable_throwsNoTableFound() {
        let service = ScoringService()
        XCTAssertThrowsError(
            try service.score(test: carrera, mark: .plain(100), age: 20, sex: .male, category: nil, tables: [])
        ) { error in
            XCTAssertTrue(error is ScoringError)
        }
    }

    func testScore_ageOutsideRange_throwsNoTableFound() {
        let service = ScoringService()
        let table = makeTable(ageMin: 18, ageMax: 24, ranges: standardRanges)
        XCTAssertThrowsError(
            try service.score(test: carrera, mark: .plain(100), age: 30, sex: .male, category: nil, tables: [table])
        )
    }

    func testScore_wrongSex_throwsNoTableFound() {
        let service = ScoringService()
        let table = makeTable(sex: .male, ranges: standardRanges)
        XCTAssertThrowsError(
            try service.score(test: carrera, mark: .plain(100), age: 20, sex: .female, category: nil, tables: [table])
        )
    }

    func testScore_isApto_whenScoreMeetsPassingThreshold() throws {
        let service = ScoringService()
        let table = makeTable(passingScore: 8, ranges: standardRanges)
        let result = try service.score(test: carrera, mark: .plain(100), age: 20, sex: .male, category: nil, tables: [table])
        XCTAssertEqual(result.score, 10)
        XCTAssertTrue(result.isApto)
    }

    func testScore_isNotApto_whenBelowPassingThreshold() throws {
        let service = ScoringService()
        let table = makeTable(passingScore: 8, ranges: standardRanges)
        let result = try service.score(test: carrera, mark: .plain(250), age: 20, sex: .male, category: nil, tables: [table])
        XCTAssertEqual(result.score, 6)
        XCTAssertFalse(result.isApto)
    }

    func testScore_prefersCategorySpecificTableOverGeneralTable() throws {
        let service = ScoringService()
        let generalTable = makeTable(category: nil, passingScore: 5, ranges: [ScoreRange(minimum: 0, maximum: 1000, score: 3)])
        let specificTable = makeTable(category: "Élite", passingScore: 5, ranges: [ScoreRange(minimum: 0, maximum: 1000, score: 9)])

        let result = try service.score(
            test: carrera, mark: .plain(100), age: 20, sex: .male, category: "Élite",
            tables: [generalTable, specificTable]
        )
        XCTAssertEqual(result.score, 9)
    }

    func testAggregate_finalResultIsAptoOnlyWhenAllTestsPass() {
        let service = ScoringService()
        let passing = ScoreResult(test: carrera, mark: .plain(1), score: 10, maxScore: 10, isApto: true, matchedTable: nil)
        let failing = ScoreResult(test: carrera, mark: .plain(1), score: 2, maxScore: 10, isApto: false, matchedTable: nil)

        let allPassing = service.aggregate([passing, passing])
        XCTAssertTrue(allPassing.isApto)
        XCTAssertEqual(allPassing.totalScore, 20)

        let mixed = service.aggregate([passing, failing])
        XCTAssertFalse(mixed.isApto)

        let empty = service.aggregate([])
        XCTAssertFalse(empty.isApto, "Una sesión sin pruebas no debe considerarse APTO.")
    }
}

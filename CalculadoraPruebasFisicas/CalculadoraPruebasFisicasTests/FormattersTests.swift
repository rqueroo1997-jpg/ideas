import XCTest
@testable import CalculadoraPruebasFisicas

final class FormattersTests: XCTestCase {

    func testDecimal_wholeNumber_hasNoDecimalSeparator() {
        XCTAssertEqual(Formatters.decimal(10), "10")
    }

    func testDecimal_usesCommaAsDecimalSeparator() {
        XCTAssertEqual(Formatters.decimal(8.5), "8,5")
    }

    func testTimeFromSeconds_wholeSeconds_formatsWithoutCentiseconds() {
        XCTAssertEqual(Formatters.timeFromSeconds(232), "03:52")
    }

    func testTimeFromSeconds_withFraction_includesCentiseconds() {
        XCTAssertEqual(Formatters.timeFromSeconds(232.4), "03:52,40")
    }

    func testMeasurementTime_roundTripsToExpectedSeconds() {
        let measurement = TestMeasurement.time(minutes: 3, seconds: 52, centiseconds: 0)
        XCTAssertEqual(measurement.value, 232, accuracy: 0.001)
        XCTAssertEqual(measurement.displayText, "03:52")
    }
}

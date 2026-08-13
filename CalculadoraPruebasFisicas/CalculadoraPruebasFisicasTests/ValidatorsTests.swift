import XCTest
@testable import CalculadoraPruebasFisicas

final class ValidatorsTests: XCTestCase {

    // MARK: - Nombre

    func testValidateName_empty_throws() {
        XCTAssertThrowsError(try Validators.validateName("   "))
    }

    func testValidateName_valid_doesNotThrow() {
        XCTAssertNoThrow(try Validators.validateName("Alex"))
    }

    func testValidateName_tooLong_throws() {
        let longName = String(repeating: "a", count: 61)
        XCTAssertThrowsError(try Validators.validateName(longName))
    }

    // MARK: - Fecha de nacimiento / edad

    func testValidateBirthDate_futureDate_throws() {
        let future = Calendar.current.date(byAdding: .day, value: 1, to: Date())!
        XCTAssertThrowsError(try Validators.validateBirthDate(future))
    }

    func testValidateBirthDate_tooYoung_throws() {
        let tooYoung = Calendar.current.date(byAdding: .year, value: -10, to: Date())!
        XCTAssertThrowsError(try Validators.validateBirthDate(tooYoung))
    }

    func testValidateBirthDate_tooOld_throws() {
        let tooOld = Calendar.current.date(byAdding: .year, value: -90, to: Date())!
        XCTAssertThrowsError(try Validators.validateBirthDate(tooOld))
    }

    func testValidateBirthDate_reasonableAge_doesNotThrow() {
        let reasonable = Calendar.current.date(byAdding: .year, value: -25, to: Date())!
        XCTAssertNoThrow(try Validators.validateBirthDate(reasonable))
    }

    // MARK: - Altura / peso

    func testValidateHeight_nil_doesNotThrow() {
        XCTAssertNoThrow(try Validators.validateHeight(nil))
    }

    func testValidateHeight_outOfRange_throws() {
        XCTAssertThrowsError(try Validators.validateHeight(50))
        XCTAssertThrowsError(try Validators.validateHeight(300))
    }

    func testValidateWeight_outOfRange_throws() {
        XCTAssertThrowsError(try Validators.validateWeight(10))
        XCTAssertThrowsError(try Validators.validateWeight(400))
    }

    // MARK: - Tiempo

    func testValidateTime_zero_throws() {
        XCTAssertThrowsError(try Validators.validateTime(minutes: 0, seconds: 0, centiseconds: 0))
    }

    func testValidateTime_invalidSeconds_throws() {
        XCTAssertThrowsError(try Validators.validateTime(minutes: 0, seconds: 60, centiseconds: 0))
    }

    func testValidateTime_invalidCentiseconds_throws() {
        XCTAssertThrowsError(try Validators.validateTime(minutes: 0, seconds: 0, centiseconds: 100))
    }

    func testValidateTime_negativeMinutes_throws() {
        XCTAssertThrowsError(try Validators.validateTime(minutes: -1, seconds: 0, centiseconds: 0))
    }

    func testValidateTime_valid_doesNotThrow() {
        XCTAssertNoThrow(try Validators.validateTime(minutes: 3, seconds: 52, centiseconds: 40))
    }

    // MARK: - Magnitudes positivas

    func testValidatePositiveMeasurement_negative_throws() {
        XCTAssertThrowsError(try Validators.validatePositiveMeasurement(-1, kind: .distanceMeters))
    }

    func testValidatePositiveMeasurement_nonIntegerRepetitions_throws() {
        XCTAssertThrowsError(try Validators.validatePositiveMeasurement(10.5, kind: .repetitions))
    }

    func testValidatePositiveMeasurement_integerRepetitions_doesNotThrow() {
        XCTAssertNoThrow(try Validators.validatePositiveMeasurement(25, kind: .repetitions))
    }

    func testValidatePositiveMeasurement_excessiveDistance_throws() {
        XCTAssertThrowsError(try Validators.validatePositiveMeasurement(1_000_000, kind: .distanceMeters))
    }

    func testValidatePositiveMeasurement_nonFiniteValue_throws() {
        XCTAssertThrowsError(try Validators.validatePositiveMeasurement(.nan, kind: .distanceMeters))
        XCTAssertThrowsError(try Validators.validatePositiveMeasurement(.infinity, kind: .distanceMeters))
    }

    func testValidatePositiveMeasurement_zero_doesNotThrow() {
        XCTAssertNoThrow(try Validators.validatePositiveMeasurement(0, kind: .repetitions))
    }
}

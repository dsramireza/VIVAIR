Feature: Passenger reservation management

  @HU-007
  Scenario: View the authenticated passenger's own booking
    Given "ana.rios@example.test" owns Confirmed booking "VA-TEST-001"
    And "luis.perez@example.test" owns Confirmed booking "VA-TEST-002"
    When "ana.rios@example.test" opens the reservation list
    Then the list contains "VA-TEST-001"
    And the list does not contain "VA-TEST-002"

  @HU-007
  Scenario: View all passengers and seats in a group booking
    Given Confirmed booking "VA-TEST-001" contains two passengers with seats "1A" and "3A"
    When its owner opens booking "VA-TEST-001"
    Then the booking details show both passengers, both seats, the route, departure time, and confirmed total

  @HU-008
  Scenario: Cancel the entire group booking before departure
    Given the application clock is "2026-10-07T12:00:00-05:00"
    And Confirmed booking "VA-TEST-001" has two passengers on a flight departing at "2026-10-15T09:00:00-05:00"
    When its owner cancels "VA-TEST-001"
    Then the booking status becomes "Cancelled"
    And both assigned seats become available
    And no real refund is initiated

  @HU-008
  Scenario: Reject cancellation at or after the scheduled departure
    Given the application clock is "2026-10-15T09:00:00-05:00"
    And booking "VA-TEST-001" is Confirmed for a flight departing at "2026-10-15T09:00:00-05:00"
    When its owner requests cancellation
    Then cancellation is rejected
    And the booking remains Confirmed


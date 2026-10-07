Feature: Seat selection and mock payment

  @HU-005
  Scenario: Select seats for a group of four passengers
    Given a Published flight has 20 seats labelled by row and column
    And seats "1A", "1B", "3A", and "3B" are available
    When the passenger selects those four seats for four passengers
    Then the selection contains four passengers and four distinct seats
    And each selected seat retains its displayed category

  @HU-005
  Scenario: Reject a group larger than four passengers
    Given a Published flight has 20 seats
    When the passenger attempts to add five passengers to one booking
    Then the booking selection is rejected
    And no seat is reserved

  @HU-005
  Scenario: Require identity details for every passenger
    Given a passenger selected seats "1A" and "3A" for two travelers
    When the passenger enters "Ana Ríos", document type "CC", document number "100000001", for seat "1A"
    And the passenger leaves the name, document type, or document number empty for seat "3A"
    Then the booking cannot proceed to mock payment
    And the missing identity field is identified for seat "3A"

  @HU-005
  Scenario: Prevent selection of an occupied seat
    Given seat "1A" on a Published flight belongs to a Confirmed booking
    When another passenger views the seat map
    Then seat "1A" is unavailable for selection

  @HU-006
  Scenario: Confirm an approved mock payment and create a booking
    Given a Published flight has a base fare of COP 200000
    And the passenger selected one Estándar seat and one Plus seat
    And both seats remain available
    When the passenger selects the mock payment result "Approved"
    Then the displayed total is COP 450000
    And one Confirmed booking is created with a unique booking code
    And both seats belong to that booking

  @HU-006
  Scenario: Reject a mock payment without creating a booking or occupying seats
    Given a Published flight has a base fare of COP 200000
    And the passenger selected one Estándar seat and one Plus seat
    When the passenger selects the mock payment result "Rejected"
    Then no booking is created
    And both seats remain available

  @HU-006
  Scenario: Reject payment if a selected seat was sold before approval
    Given the passenger selected seat "1A"
    And another Confirmed booking now owns seat "1A" on the same flight
    When the passenger selects the mock payment result "Approved"
    Then the booking is not created
    And the passenger is told that seat "1A" is no longer available
    And the other booking remains unchanged

  @HU-006
  Scenario: Keep a group booking atomic when one selected seat was sold before approval
    Given the passenger selected seats "1A" and "3A" for two travelers
    And another Confirmed booking now owns seat "3A" on the same flight
    When the passenger selects the mock payment result "Approved"
    Then no booking is created for the passenger
    And seat "1A" remains available
    And seat "3A" remains assigned only to the other Confirmed booking

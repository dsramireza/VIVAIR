Feature: Administrator flight management

  @HU-009
  Scenario: Create a flight in Draft status with the fixed seat map
    Given an Administrator is authenticated
    And the application clock is "2026-10-07T12:00:00-05:00"
    When the administrator creates a flight from Bogotá to Medellín departing at "2026-10-15T09:00:00-05:00" with a base fare of COP 200000
    Then the flight is saved with status "Draft"
    And its seat map contains 20 seats labelled rows 1 to 5 and columns A to D
    And rows 1 and 2 have category "Plus"
    And rows 3 to 5 have category "Estándar"

  @HU-009
  Scenario: Publish a future flight with distinct catalog cities
    Given an Administrator is authenticated
    And the application clock is "2026-10-07T12:00:00-05:00"
    And the Administrator has a Draft flight from Bogotá to Medellín departing at "2026-10-15T09:00:00-05:00"
    When the administrator publishes the flight
    Then its status becomes "Published"
    And passengers can find it in flight search

  @HU-009
  Scenario: Reject publication when origin and destination are the same city
    Given an Administrator is authenticated
    And the application clock is "2026-10-07T12:00:00-05:00"
    And the Administrator has a Draft flight from Bogotá to Bogotá departing at "2026-10-15T09:00:00-05:00"
    When the administrator publishes the flight
    Then publication is rejected with the field error "El destino debe ser distinto al origen"
    And the flight does not appear in passenger search

  @HU-009
  Scenario: Reject publication when departure is not in the future
    Given an Administrator is authenticated
    And the application clock is "2026-10-07T12:00:00-05:00"
    And the Administrator has a Draft flight from Bogotá to Medellín departing at "2026-10-06T09:00:00-05:00"
    When the administrator publishes the flight
    Then publication is rejected with the field error "La salida debe ser posterior a la hora actual"
    And the flight does not appear in passenger search

  @HU-009
  Scenario: Withdraw a flight that has confirmed bookings
    Given a Published flight has one Confirmed booking
    When the administrator withdraws the flight
    Then its status becomes "Withdrawn"
    And passengers cannot create new bookings for that flight
    And its existing booking and sales history remain available

  @HU-009
  Scenario: Delete a flight that has never had a booking
    Given an Administrator is authenticated
    And a Draft flight has no booking records
    When the administrator deletes the flight
    Then the flight is removed from the flight list
    And the flight cannot be found in passenger search

  @HU-009
  Scenario: Republish a withdrawn flight that still departs in the future
    Given an Administrator is authenticated
    And the application clock is "2026-10-07T12:00:00-05:00"
    And a Withdrawn flight departs at "2026-10-15T09:00:00-05:00"
    When the administrator publishes it again
    Then its status becomes "Published"
    And passengers can find it in flight search

  @HU-010
  Scenario: Update confirmed bookings and notify passengers after a flight change
    Given the application clock is "2026-10-07T12:00:00-05:00"
    And the Administrator is authenticated
    And a Published flight from Bogotá to Medellín departs at "2026-10-15T09:00:00-05:00"
    And "ana.rios@example.test" owns a Confirmed booking for that flight with seat "1A" and total COP 250000
    When the administrator changes the route to Cali to Cartagena and departure to "2026-10-16T11:00:00-05:00"
    Then the confirmed booking shows route Cali to Cartagena and departure "2026-10-16T11:00:00-05:00"
    And the booking still has seat "1A" and total COP 250000
    And "ana.rios@example.test" sees an in-app notice containing the old and new route and departure time

  @HU-010
  Scenario: Keep a cancelled booking's flight details unchanged after a flight change
    Given an Administrator is authenticated
    And "ana.rios@example.test" owns a Cancelled booking for a flight from Bogotá to Medellín departing at "2026-10-15T09:00:00-05:00"
    When the administrator changes that flight's route to Cali to Cartagena and departure to "2026-10-16T11:00:00-05:00"
    Then the cancelled booking continues to show route Bogotá to Medellín and departure "2026-10-15T09:00:00-05:00"
    And no flight-change notice is created for that cancelled booking

  @HU-010
  Scenario: Preserve a confirmed booking total when the flight fare changes
    Given an Administrator is authenticated
    And the application clock is "2026-10-07T12:00:00-05:00"
    And a Published flight departs at "2026-10-15T09:00:00-05:00" with a base fare of COP 200000
    And "ana.rios@example.test" owns a Confirmed booking with total COP 250000
    When the administrator changes the flight base fare to COP 230000
    Then the existing booking total remains COP 250000
    And the new base fare is COP 230000 for future bookings

Feature: Flight discovery and fare information

  @HU-003
  Scenario: Find only published future flights matching the selected route and date
    Given the application clock is "2026-10-07T12:00:00-05:00"
    And the catalog contains Bogotá, Medellín, Cali, Cartagena, and Barranquilla
    And a Published flight from Bogotá to Medellín departs at "2026-10-15T09:00:00-05:00"
    And a Draft flight from Bogotá to Medellín departs at "2026-10-15T11:00:00-05:00"
    And a Withdrawn flight from Bogotá to Medellín departs at "2026-10-15T13:00:00-05:00"
    And a Published flight from Bogotá to Cali departs at "2026-10-15T09:00:00-05:00"
    And a Published flight from Bogotá to Medellín departed at "2026-10-06T09:00:00-05:00"
    When the passenger searches Bogotá to Medellín for "2026-10-15"
    Then the result contains only the Published future flight departing at "2026-10-15T09:00:00-05:00"

  @HU-003
  Scenario: Show an empty result when no flight matches
    Given the application clock is "2026-10-07T12:00:00-05:00"
    And no Published future flight exists from Bogotá to Cartagena on "2026-10-15"
    When the passenger searches Bogotá to Cartagena for "2026-10-15"
    Then the result contains no flights

  @HU-003
  Scenario: Return no flights for a search date before the application date
    Given the application clock is "2026-10-07T12:00:00-05:00"
    When the passenger searches Bogotá to Medellín for "2026-10-06"
    Then the result contains no flights

  @HU-003
  Scenario: Reject a search with the same origin and destination
    Given the application clock is "2026-10-07T12:00:00-05:00"
    When the passenger searches Bogotá to Bogotá for "2026-10-15"
    Then the search is rejected with the message "El origen y el destino deben ser distintos"
    And no flights are returned

  @HU-004
  Scenario: View the fare and baggage allowance for each seat category
    Given a Published flight from Bogotá to Medellín has a base fare of COP 200000
    When the passenger views the flight details
    Then the Estándar category shows a COP 0 surcharge and includes one personal item
    And the Plus category shows a COP 50000 surcharge and includes one personal item and one cabin bag up to 10 kg
    And no additional baggage can be purchased

  @HU-013
  Scenario: Browse the public catalog before signing in
    Given the application clock is "2026-10-07T12:00:00-05:00"
    And the visitor is not signed in
    And a Published flight from Bogotá to Medellín departs at "2026-10-15T09:00:00-05:00"
    And a Published flight from Cali to Cartagena departs at "2026-10-16T11:00:00-05:00"
    And a Draft flight from Bogotá to Cali departs at "2026-10-15T08:00:00-05:00"
    And a Withdrawn flight from Medellín to Cali departs at "2026-10-15T10:00:00-05:00"
    And a Published flight from Cartagena to Barranquilla departed at "2026-10-06T09:00:00-05:00"
    When the visitor opens "/vuelos" without search parameters
    Then the same page lists the Bogotá to Medellín flight and the Cali to Cartagena flight in departure-time order
    And the Draft, Withdrawn, and departed flights are not listed

  @HU-013
  Scenario Outline: Filter the catalog by any supplied search criteria
    Given the application clock is "2026-10-07T12:00:00-05:00"
    And the public catalog contains a Published future flight from Bogotá to Medellín on "2026-10-15"
    And the public catalog contains a Published future flight from Bogotá to Cali on "2026-10-16"
    And the public catalog contains a Published future flight from Medellín to Bogotá on "2026-10-15"
    When the visitor applies origin "<origin>", destination "<destination>", and date "<date>" as optional filters
    Then the same catalog lists exactly "<expected flights>"

    Examples:
      | origin  | destination | date       | expected flights                  |
      | Bogotá  |             |            | Bogotá to Medellín, Bogotá to Cali |
      |         | Medellín    |            | Bogotá to Medellín                 |
      |         |             | 2026-10-15 | Bogotá to Medellín, Medellín to Bogotá |
      | Bogotá  | Medellín    |            | Bogotá to Medellín                 |
      | Bogotá  |             | 2026-10-15 | Bogotá to Medellín                 |
      |         | Medellín    | 2026-10-15 | Bogotá to Medellín                 |
      | Bogotá  | Medellín    | 2026-10-15 | Bogotá to Medellín                 |

  @HU-013
  Scenario: Show an empty state when no published future flight matches the optional filters
    Given the application clock is "2026-10-07T12:00:00-05:00"
    And no Published future flight exists from Bogotá to Barranquilla on "2026-10-15"
    When the visitor filters the catalog by origin "Bogotá", destination "Barranquilla", and date "2026-10-15"
    Then the same page shows no matching flights

  @HU-013
  Scenario: Apply the date filter using the America/Bogota calendar day
    Given the application clock is "2026-10-07T12:00:00-05:00"
    And a Published flight from Bogotá to Medellín departs at "2026-10-15T23:30:00-05:00"
    And a Published flight from Cali to Cartagena departs at "2026-10-16T00:30:00-05:00"
    When the visitor filters the catalog by departure date "2026-10-15"
    Then the same catalog lists the Bogotá to Medellín flight
    And the Cali to Cartagena flight is not listed

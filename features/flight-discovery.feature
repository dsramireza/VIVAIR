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

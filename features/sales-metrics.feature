Feature: Administrator sales metrics

  @HU-011
  Scenario: Calculate counts and income from non-cancelled confirmed bookings
    Given an Administrator is authenticated
    And Confirmed booking "VA-TEST-001" has two passengers and total COP 450000
    And Confirmed booking "VA-TEST-002" has one passenger and total COP 200000
    And booking "VA-TEST-003" with one passenger and total COP 100000 is Cancelled
    When the administrator opens the sales dashboard
    Then the dashboard shows 2 confirmed bookings
    And the dashboard shows 3 confirmed passengers
    And the dashboard shows COP 650000 in sales

  @HU-011
  Scenario: Deny a passenger access to sales metrics
    Given "ana.rios@example.test" is authenticated with the Passenger role
    When the passenger requests the sales dashboard
    Then access is denied
    And no sales metrics are returned

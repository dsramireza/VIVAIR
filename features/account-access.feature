Feature: Passenger accounts and role-based access

  @HU-001
  Scenario: Register a passenger account without email confirmation
    Given no account exists for "ana.rios@example.test"
    When a visitor registers with name "Ana Ríos", email "ana.rios@example.test", and password "DemoPass2026!"
    Then an account for "ana.rios@example.test" exists with the Passenger role
    And registration does not require email confirmation

  @HU-001
  Scenario: Reject registration with an email that already has an account
    Given an account exists for "ana.rios@example.test"
    When a visitor registers with name "Ana Ríos", email "ana.rios@example.test", and password "DemoPass2026!"
    Then registration is rejected with the message "Ya existe una cuenta con este correo"
    And the existing account remains unchanged

  @HU-002
  Scenario: Sign in with valid passenger credentials
    Given a Passenger account exists for "ana.rios@example.test" with password "DemoPass2026!"
    When the passenger signs in with that email and password
    Then the passenger is authenticated
    And the passenger can open the reservation area

  @HU-002
  Scenario: Reject sign-in with an incorrect password
    Given a Passenger account exists for "ana.rios@example.test" with password "DemoPass2026!"
    When a visitor signs in with email "ana.rios@example.test" and password "WrongPass2026!"
    Then sign-in is rejected
    And no authenticated session is created

  @HU-002
  Scenario: Prevent a passenger from opening administrator functions
    Given "ana.rios@example.test" is authenticated with the Passenger role
    When the passenger requests the administrator flight-management area
    Then access is denied
    And no administrator data is returned

  @HU-002
  Scenario: Allow a prepared administrator account to open administrator functions
    Given "admin@vivair.example.test" is authenticated with the Administrator role
    When the administrator requests the flight-management area
    Then access is granted

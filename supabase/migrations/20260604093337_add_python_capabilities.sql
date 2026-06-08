/*
  # Add Python-Based Non-AI Capabilities

  ## Overview
  Inserts two new Non-AI, Python-function-based capabilities into the repository,
  along with their associated operational metrics.

  ## New Capabilities

  ### 1. Claims Auto-Adjudication Engine
  Python script that auto-adjudicates clean claims against business rules,
  reducing manual review queues and processing cycle times in Claims Operations.

  ### 2. Provider Roster Delta Sync
  Python automation that compares incoming provider roster files against the
  internal directory, applies adds/changes/terminations, and generates exception
  reports for compliance review.

  ## Notes
  - Only inserts if capabilities with these names do not already exist
  - Metrics are inserted in sync with capability records
*/

DO $$
DECLARE
  cap6 uuid;
  cap7 uuid;
BEGIN

  -- Capability 6: Claims Auto-Adjudication Engine
  IF NOT EXISTS (SELECT 1 FROM capabilities WHERE name = 'Claims Auto-Adjudication Engine') THEN
    INSERT INTO capabilities (
      name, short_description, long_description, area_of_impact, capability_type,
      how_to_access, prerequisites, where_to_execute, executable_path, estimated_savings,
      point_of_contact, implemented_team, access_type, shared_path_location, url_location
    ) VALUES (
      'Claims Auto-Adjudication Engine',
      'Python-based engine that auto-adjudicates clean claims against payer business rules, eliminating manual review for straight-through transactions.',
      'The Claims Auto-Adjudication Engine is a Python automation that ingests daily claims files, applies a configurable rule library (eligibility, benefit limits, coordination of benefits, duplicate detection) and routes clean claims directly to payment while isolating exceptions for analyst review. It integrates with the claims management system via its batch API and generates an adjudication summary report upon each run. The engine operates on a scheduled daily trigger and can also be invoked ad-hoc from the shared network location.',
      ARRAY['Claims Operations'],
      'Non-AI',
      'Navigate to the shared path below and execute adjudication_engine.py using the provided batch launcher. Ensure the claims inbox folder has been loaded before running.',
      'Python 3.11 runtime on the Claims Processing Server, claims_admin AD role, read access to claims inbox share, write access to adjudication output share.',
      'Claims Processing Server – Batch Node',
      '\\Server\Applications\Claims\AdjudicationEngine\adjudication_engine.py',
      '$520K annual savings; 4,100+ hours reclaimed per year',
      'Robert Kim – r.kim@company.com',
      'Claims Operations Automation Team',
      'shared_path',
      '\\Server\Applications\Claims\AdjudicationEngine\',
      ''
    ) RETURNING id INTO cap6;

    INSERT INTO capability_metrics (
      capability_id, avg_hours_saved_per_run, total_runs, ytd_hours_saved,
      ytd_financial_savings, weekly_savings, monthly_savings, quarterly_savings, yearly_savings,
      financial_savings, operational_efficiency_gain_pct, automation_accuracy_pct, last_execution_date
    ) VALUES (
      cap6, 16.7, 245, 4100, 520000, 10000, 43333, 130000, 520000, 520000, 83.4, 99.3,
      now() - interval '12 hours'
    );
  END IF;

  -- Capability 7: Provider Roster Delta Sync
  IF NOT EXISTS (SELECT 1 FROM capabilities WHERE name = 'Provider Roster Delta Sync') THEN
    INSERT INTO capabilities (
      name, short_description, long_description, area_of_impact, capability_type,
      how_to_access, prerequisites, where_to_execute, executable_path, estimated_savings,
      point_of_contact, implemented_team, access_type, shared_path_location, url_location
    ) VALUES (
      'Provider Roster Delta Sync',
      'Python script that compares incoming provider roster files to the internal directory, applies delta changes, and produces exception and compliance reports.',
      'The Provider Roster Delta Sync script consumes weekly provider roster files delivered by health plans, performs a field-level delta comparison against the internal Provider Directory, and orchestrates automated apply of adds, demographic changes, and terminations. It produces a structured exception report for records that fail validation rules and a compliance summary for audit purposes. The script is Python 3.11, parameterized via a config file, and designed to run on demand or on a scheduled weekly basis from the shared network location.',
      ARRAY['Provider Operations', 'Network Management'],
      'Non-AI',
      'Access the shared path below and execute roster_delta_sync.py. Pass the incoming roster file path as the --input argument, or rely on the auto-detect mode which scans the default inbox folder.',
      'Python 3.11 runtime, provider_ops AD role, access to Provider Directory DB (read/write), access to roster inbox share.',
      'Provider Operations Server – Roster Processing Node',
      '\\Server\Applications\Provider\RosterDeltaSync\roster_delta_sync.py',
      '$390K annual savings; 3,100+ hours reclaimed per year',
      'Angela Torres – a.torres@company.com',
      'Provider Network Automation Team',
      'shared_path',
      '\\Server\Applications\Provider\RosterDeltaSync\',
      ''
    ) RETURNING id INTO cap7;

    INSERT INTO capability_metrics (
      capability_id, avg_hours_saved_per_run, total_runs, ytd_hours_saved,
      ytd_financial_savings, weekly_savings, monthly_savings, quarterly_savings, yearly_savings,
      financial_savings, operational_efficiency_gain_pct, automation_accuracy_pct, last_execution_date
    ) VALUES (
      cap7, 12.4, 250, 3100, 390000, 7500, 32500, 97500, 390000, 390000, 74.8, 98.4,
      now() - interval '2 days'
    );
  END IF;

END $$;

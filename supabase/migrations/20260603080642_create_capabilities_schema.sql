/*
  # Capability Repository Portal – Initial Schema

  ## Overview
  Creates the full schema for the Capability Repository Portal, an enterprise
  healthcare operations platform for managing, executing, and measuring
  organizational capabilities.

  ## New Tables

  ### 1. capabilities
  Core catalog of all capabilities in the repository.
  - id (uuid, pk)
  - name – display name of the capability
  - short_description – brief summary shown on cards
  - long_description – full narrative description
  - area_of_impact – business area(s) affected
  - capability_type – 'AI' | 'Non-AI'
  - how_to_access – access instructions
  - prerequisites – prerequisites to execute
  - where_to_execute – execution environment description
  - executable_path – filesystem path or command
  - estimated_savings – narrative savings estimate
  - point_of_contact – POC name / email
  - implemented_team – team that built the capability
  - access_type – 'shared_path' | 'url'
  - shared_path_location – UNC or filesystem path
  - url_location – web URL
  - last_updated – timestamp of last edit
  - created_at / updated_at

  ### 2. capability_metrics
  Operational metrics per capability.
  - id (uuid, pk)
  - capability_id (fk → capabilities)
  - avg_hours_saved_per_run
  - total_runs
  - ytd_hours_saved
  - ytd_financial_savings
  - weekly_savings
  - monthly_savings
  - quarterly_savings
  - yearly_savings
  - financial_savings
  - operational_efficiency_gain_pct
  - automation_accuracy_pct
  - last_execution_date
  - created_at / updated_at

  ## Security
  - RLS enabled on both tables
  - Authenticated users can read all capabilities and metrics
  - Authenticated users can insert/update/delete capabilities and metrics

  ## Seed Data
  Seeds the 5 sample capabilities described in the product spec.
*/

-- ============================================================
-- TABLE: capabilities
-- ============================================================
CREATE TABLE IF NOT EXISTS capabilities (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  short_description     text NOT NULL DEFAULT '',
  long_description      text NOT NULL DEFAULT '',
  area_of_impact        text[] NOT NULL DEFAULT '{}',
  capability_type       text NOT NULL DEFAULT 'Non-AI' CHECK (capability_type IN ('AI', 'Non-AI')),
  how_to_access         text NOT NULL DEFAULT '',
  prerequisites         text NOT NULL DEFAULT '',
  where_to_execute      text NOT NULL DEFAULT '',
  executable_path       text NOT NULL DEFAULT '',
  estimated_savings     text NOT NULL DEFAULT '',
  point_of_contact      text NOT NULL DEFAULT '',
  implemented_team      text NOT NULL DEFAULT '',
  access_type           text NOT NULL DEFAULT 'shared_path' CHECK (access_type IN ('shared_path', 'url')),
  shared_path_location  text NOT NULL DEFAULT '',
  url_location          text NOT NULL DEFAULT '',
  last_updated          timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read capabilities"
  ON capabilities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert capabilities"
  ON capabilities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update capabilities"
  ON capabilities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete capabilities"
  ON capabilities FOR DELETE
  TO authenticated
  USING (true);

-- Allow anon read for demo purposes (no auth implemented yet)
CREATE POLICY "Anon users can read capabilities"
  ON capabilities FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert capabilities"
  ON capabilities FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update capabilities"
  ON capabilities FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete capabilities"
  ON capabilities FOR DELETE
  TO anon
  USING (true);

-- ============================================================
-- TABLE: capability_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS capability_metrics (
  id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id                  uuid NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  avg_hours_saved_per_run        numeric(10,2) NOT NULL DEFAULT 0,
  total_runs                     integer NOT NULL DEFAULT 0,
  ytd_hours_saved                numeric(10,2) NOT NULL DEFAULT 0,
  ytd_financial_savings          numeric(14,2) NOT NULL DEFAULT 0,
  weekly_savings                 numeric(14,2) NOT NULL DEFAULT 0,
  monthly_savings                numeric(14,2) NOT NULL DEFAULT 0,
  quarterly_savings              numeric(14,2) NOT NULL DEFAULT 0,
  yearly_savings                 numeric(14,2) NOT NULL DEFAULT 0,
  financial_savings              numeric(14,2) NOT NULL DEFAULT 0,
  operational_efficiency_gain_pct numeric(5,2) NOT NULL DEFAULT 0,
  automation_accuracy_pct        numeric(5,2) NOT NULL DEFAULT 0,
  last_execution_date            timestamptz,
  created_at                     timestamptz NOT NULL DEFAULT now(),
  updated_at                     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE capability_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read metrics"
  ON capability_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert metrics"
  ON capability_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update metrics"
  ON capability_metrics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete metrics"
  ON capability_metrics FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anon users can read metrics"
  ON capability_metrics FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert metrics"
  ON capability_metrics FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update metrics"
  ON capability_metrics FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete metrics"
  ON capability_metrics FOR DELETE
  TO anon
  USING (true);

-- ============================================================
-- SEED DATA – 5 sample capabilities
-- ============================================================
DO $$
DECLARE
  cap1 uuid; cap2 uuid; cap3 uuid; cap4 uuid; cap5 uuid;
BEGIN
  -- Only seed if table is empty
  IF (SELECT COUNT(*) FROM capabilities) = 0 THEN

    INSERT INTO capabilities (id, name, short_description, long_description, area_of_impact, capability_type,
      how_to_access, prerequisites, where_to_execute, executable_path, estimated_savings,
      point_of_contact, implemented_team, access_type, shared_path_location, url_location)
    VALUES
      (gen_random_uuid(),
       'OEC Medicare Member Flow',
       'Automates and streamlines Medicare member enrollment processing through the OEC workflow.',
       'The OEC Medicare Member Flow capability provides end-to-end automation of Medicare member enrollment and maintenance transactions. It integrates directly with CMS systems to validate eligibility, process enrollment requests, and reconcile discrepancies in real time, significantly reducing manual intervention and processing errors.',
       ARRAY['Medicare Operations'],
       'Non-AI',
       'Access via the shared network path or launch through the internal operations portal. Requires VPN connection.',
       'Active VPN connection, Medicare Operations role in AD, access to OEC staging environment.',
       'Internal Operations Server – Medicare Processing Node',
       '\\Server\Applications\OEC\MedicareMemberFlow\run.bat',
       '$450K annual savings; 3,500+ hours reclaimed per year',
       'Jane Smith – jane.smith@company.com',
       'Medicare Operations Automation Team',
       'shared_path',
       '\\Server\Applications\OEC\MedicareMemberFlow\',
       '')
    RETURNING id INTO cap1;

    INSERT INTO capabilities (id, name, short_description, long_description, area_of_impact, capability_type,
      how_to_access, prerequisites, where_to_execute, executable_path, estimated_savings,
      point_of_contact, implemented_team, access_type, shared_path_location, url_location)
    VALUES
      (gen_random_uuid(),
       'NJ Medicaid 834 Member Flow',
       'Processes New Jersey Medicaid 834 enrollment transactions and member updates.',
       'The NJ Medicaid 834 Member Flow handles inbound 834 EDI transactions for New Jersey Medicaid, parsing enrollment adds, changes, and terminations. It performs automated validation, updates member records, and generates exception reports for manual review, reducing processing cycle time from days to hours.',
       ARRAY['Medicaid Enrollment'],
       'Non-AI',
       'Available through the Medicaid Operations portal or via shared network path.',
       'Medicaid Enrollment role, NJ EDI credentials, access to member database.',
       'Medicaid Processing Server – NJ Node',
       '\\Server\Applications\Medicaid\NJ\834Flow\run.bat',
       '$375K annual savings; 2,800+ hours reclaimed per year',
       'Michael Torres – m.torres@company.com',
       'Medicaid Enrollment Technology Team',
       'shared_path',
       '\\Server\Applications\Medicaid\NJ\834Flow\',
       '')
    RETURNING id INTO cap2;

    INSERT INTO capabilities (id, name, short_description, long_description, area_of_impact, capability_type,
      how_to_access, prerequisites, where_to_execute, executable_path, estimated_savings,
      point_of_contact, implemented_team, access_type, shared_path_location, url_location)
    VALUES
      (gen_random_uuid(),
       'KY Medicaid 834 Member Flow',
       'Automates Kentucky Medicaid enrollment transaction processing and reconciliation.',
       'The KY Medicaid 834 Member Flow automates the intake and processing of 834 EDI files for Kentucky Medicaid. It performs automated member record reconciliation, flags discrepancies for review, and generates compliance-ready reporting for state regulatory submissions.',
       ARRAY['Medicaid Enrollment'],
       'Non-AI',
       'Access via internal Medicaid portal or shared network path with proper role assignment.',
       'Medicaid Enrollment role, KY EDI system credentials, reconciliation database access.',
       'Medicaid Processing Server – KY Node',
       '\\Server\Applications\Medicaid\KY\834Flow\run.bat',
       '$310K annual savings; 2,450+ hours reclaimed per year',
       'Lisa Park – l.park@company.com',
       'Medicaid Enrollment Technology Team',
       'shared_path',
       '\\Server\Applications\Medicaid\KY\834Flow\',
       '')
    RETURNING id INTO cap3;

    INSERT INTO capabilities (id, name, short_description, long_description, area_of_impact, capability_type,
      how_to_access, prerequisites, where_to_execute, executable_path, estimated_savings,
      point_of_contact, implemented_team, access_type, shared_path_location, url_location)
    VALUES
      (gen_random_uuid(),
       'HI Medicaid 834 Member Flow',
       'Supports Hawaii Medicaid member enrollment and maintenance processing.',
       'The HI Medicaid 834 Member Flow manages enrollment and maintenance transactions for Hawaii Medicaid members. Leveraging automated EDI parsing and rule-based validation, the capability processes high volumes of transactions accurately while ensuring compliance with Hawaii QUEST Integration requirements.',
       ARRAY['Medicaid Enrollment'],
       'Non-AI',
       'Access through the Medicaid portal or shared path. Ensure HI EDI access is provisioned.',
       'Medicaid Enrollment role, Hawaii QUEST system credentials, network access to HI processing node.',
       'Medicaid Processing Server – HI Node',
       '\\Server\Applications\Medicaid\HI\834Flow\run.bat',
       '$275K annual savings; 2,100+ hours reclaimed per year',
       'David Chen – d.chen@company.com',
       'Medicaid Enrollment Technology Team',
       'shared_path',
       '\\Server\Applications\Medicaid\HI\834Flow\',
       '')
    RETURNING id INTO cap4;

    INSERT INTO capabilities (id, name, short_description, long_description, area_of_impact, capability_type,
      how_to_access, prerequisites, where_to_execute, executable_path, estimated_savings,
      point_of_contact, implemented_team, access_type, shared_path_location, url_location)
    VALUES
      (gen_random_uuid(),
       'Jira Story to Test Case Generation Agent',
       'AI-powered multi-agent solution that converts Jira user stories into detailed test cases and test scenarios.',
       'This AI capability uses a multi-agent orchestration framework to autonomously read Jira user stories, extract acceptance criteria, and generate comprehensive test case suites including positive, negative, and edge case scenarios. It integrates with Jira and test management tools to directly populate test repositories, dramatically reducing QE team effort for test case creation.',
       ARRAY['Quality Engineering', 'Test Automation'],
       'AI',
       'Access via the AI Capabilities Portal at the URL below. Requires Jira API token configuration.',
       'Jira API token, AI Capabilities Portal access, QE Operations role.',
       'AI Capabilities Portal – Cloud Hosted',
       'N/A – Web-based execution',
       '$225K annual savings; 1,600+ hours reclaimed per year',
       'Sarah Johnson – s.johnson@company.com',
       'Quality Engineering AI Team',
       'url',
       '',
       'https://ai-portal.company.com/jira-test-gen')
    RETURNING id INTO cap5;

    -- Seed metrics
    INSERT INTO capability_metrics (capability_id, avg_hours_saved_per_run, total_runs, ytd_hours_saved,
      ytd_financial_savings, weekly_savings, monthly_savings, quarterly_savings, yearly_savings,
      financial_savings, operational_efficiency_gain_pct, automation_accuracy_pct, last_execution_date)
    VALUES
      (cap1, 14.2, 246, 3500, 450000, 8500, 37500, 112500, 450000, 450000, 78.5, 99.1, now() - interval '1 day'),
      (cap2, 11.4, 245, 2800, 375000, 7200, 31250, 93750, 375000, 375000, 72.3, 98.7, now() - interval '2 days'),
      (cap3, 10.2, 240, 2450, 310000, 6000, 25833, 77500, 310000, 310000, 68.9, 97.8, now() - interval '1 day'),
      (cap4, 8.75, 240, 2100, 275000, 5300, 22917, 68750, 275000, 275000, 65.2, 98.2, now() - interval '3 days'),
      (cap5, 8.0, 200, 1600, 225000, 4300, 18750, 56250, 225000, 225000, 82.1, 96.5, now() - interval '1 day');

  END IF;
END $$;

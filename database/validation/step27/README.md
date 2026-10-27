# PragyaX Step 27 Validation & Test Execution Guide

**Author:** Nagin — Senior PostgreSQL Architect & Security Reviewer  
**Workspace:** `database/validation/step27/`  
**Target:** Local Disposable PostgreSQL 16 Instance

---

## 1. Overview of Artifacts

| Artifact | Type | Purpose |
| :--- | :--- | :--- |
| `01_test_migrations.sql` | Executable SQL | Bootstraps `anon`/`authenticated` stubs, executes migrations `0001`–`0006`, tests constraints, unique keys, negative checks, cascades, and fail-closed preflights. |
| `02_test_backend_rls.sql` | Executable SQL | Provisions isolated test backend role `test_pragyax_app`, tests least-privilege DML (`SELECT`/`INSERT` allowed, `UPDATE`/`DELETE` denied), and verifies total `anon` denial under Default-Deny RLS. |
| `03_production_permission_template.sql` | Non-Executable SQL | Formal production least-privilege role provisioning plan for review by Ankush and Arsh (held pending CR-15 sign-off). |

---

## 2. Key Architecture Fixes Resolved in Step 27

1. **Eliminated `\i` Metacommands Inside PL/pgSQL:**  
   Metacommands like `\i` are client-side directives interpreted by `psql`. They cannot be invoked inside `DO $$ ... $$` blocks. `01_test_migrations.sql` executes all migration files as top-level `psql` commands.
2. **Mounted Workspace Path Resolution:**  
   The Docker container command mounts the repository root (`-v "${PWD}:/workspace" -w /workspace`) so that `\i database/migrations/...` resolves paths accurately inside the container environment.
3. **Bootstrapped Local Role Stubs (`anon`, `authenticated`):**  
   Vanilla PostgreSQL Docker containers do not include Supabase's pre-installed roles. The test harness provisions unprivileged NOLOGIN stubs so that `REVOKE ALL ON TABLE ... FROM anon, authenticated;` in migrations `0003`, `0005`, and `0006` execute cleanly.
4. **Robust Exception Assertions:**  
   Error assertions now explicitly catch specific exceptions (`unique_violation`, `check_violation`, `insufficient_privilege`) and set a verification flag. If the expected exception is NOT raised, the test raises an explicit failure rather than silently passing.
5. **Comprehensive RLS Policies Across All Tables:**  
   Because migrations `0003`, `0005`, and `0006` enabled RLS across all 12 public tables, the test harness defines explicit scoped policies for `test_pragyax_app` across all tables, ensuring holistic backend operational flow.

---

## 3. Manual Execution Instructions (Step-by-Step)

### Step A: Spin Up Disposable Local PostgreSQL Container
Execute in PowerShell from the repository root (`C:\Users\nagin\Downloads\PragyaX`):

```powershell
# Launch an isolated, disposable PostgreSQL 16 container with workspace mounted
docker run --name pragyax-test-db `
  -e POSTGRES_PASSWORD=pragyax_test_password `
  -e POSTGRES_DB=pragyax_test `
  -v "${PWD}:/workspace" `
  -w /workspace `
  -p 127.0.0.1:5432:5432 `
  -d postgres:16-alpine
```

### Step B: Configure Environment Variable
```powershell
# Windows PowerShell
$env:TEST_DATABASE_URL = "postgresql://postgres:pragyax_test_password@127.0.0.1:5432/pragyax_test"

# Linux / macOS Bash
export TEST_DATABASE_URL="postgresql://postgres:pragyax_test_password@127.0.0.1:5432/pragyax_test"
```

### Step C: Execute Migration Test Suite
```powershell
docker exec -i pragyax-test-db psql -U postgres -d pragyax_test -f /workspace/database/validation/step27/01_test_migrations.sql
```
*Expected Output:*  
`ALL MIGRATION SUITE TESTS PASSED SUCCESSFULLY`

### Step D: Execute Backend RLS & Least-Privilege Test Suite
```powershell
docker exec -i pragyax-test-db psql -U postgres -d pragyax_test -f /workspace/database/validation/step27/02_test_backend_rls.sql
```
*Expected Output:*  
`ALL BACKEND RLS & LEAST-PRIVILEGE TESTS PASSED SUCCESSFULLY`

### Step E: Destroy Disposable Container (Optional / On Demand)
When testing and manual inspection are complete, tear down the container:

```powershell
docker stop pragyax-test-db
docker rm pragyax-test-db
```
Zero test state or temporary data persists.

---

## 4. Current Testing Status

- **Static Preflight Checks:** **PASSED** (All SQL syntax, constraints, and scripts verified offline).
- **PostgreSQL Runtime Execution:** **NOT TESTED / BLOCKED LOCALLY**  
  Neither Docker Desktop nor native PostgreSQL (`psql`) is installed on the current Windows host environment (`C:\Users\nagin\Downloads\PragyaX`).  
  Per strict project boundaries, no remote Supabase database was contacted.

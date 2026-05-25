# Migration Instructions

Before importing the CSV files, make sure the required columns are present.

## Programs CSV Required Columns

The programs CSV file must contain the following columns:

- `sector_name`
- `program_code`
- `program_name`

## Projects CSV Required Columns

The projects CSV file must contain the following columns:

- `fiscal_year`
- `sector_name`
- `program_code`
- `office_name`
- `project_code`
- `project_title`
- `project_description`
- `barangay`
- `street`

Note:

- The `project_code` column must still be included even if there is no value.
- Leave `project_code` empty if necessary to avoid breaking the import process.

---

# Production Commands
You can use these commands in the Shell feature of a paid Render instance.

```bash
cd pme-backend

python -m app.scripts.run_all_seeder

python app\scripts\import_programs.py app\scripts\csv\programs_sample.csv

python app\scripts\import_projects.py app\scripts\csv\projects_sample.csv
````

---

# Development Commands

```bash
docker compose up -d db backend

docker compose exec backend python -m app.scripts.run_all_seeder

docker compose exec backend python app/scripts/import_programs.py app/scripts/csv/programs_sample.csv

docker compose exec backend python app/scripts/import_projects.py app/scripts/csv/projects_sample.csv
```
# Database Access
Checks whether the CSV data has been uploaded
>Note: You may also use Supabase directly to check.
```bash
docker exec -it mpdoprime-db-1 psql -U admin -d pme_db
```
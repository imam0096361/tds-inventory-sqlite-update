-- Full-Text Search Migration for IT Inventory
-- Adds PostgreSQL full-text search capabilities with trigram similarity

-- 1. Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add full-text search columns to PCs table
ALTER TABLE pcs ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create full-text search index for PCs
CREATE INDEX IF NOT EXISTS pcs_search_idx ON pcs USING GIN(search_vector);

-- Automatically update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION pcs_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."pcName", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.department, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.cpu, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.motherboard, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.os, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pcs_search_vector_trigger ON pcs;
CREATE TRIGGER pcs_search_vector_trigger
BEFORE INSERT OR UPDATE ON pcs
FOR EACH ROW EXECUTE FUNCTION pcs_search_vector_update();

-- Update existing rows
UPDATE pcs SET search_vector =
  setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("pcName", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(department, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(cpu, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(motherboard, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(os, '')), 'C');

-- 3. Add trigram indexes for fuzzy username matching
CREATE INDEX IF NOT EXISTS pcs_username_trgm_idx ON pcs USING GIN(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS laptops_username_trgm_idx ON laptops USING GIN(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS mouselogs_username_trgm_idx ON "mouseLogs" USING GIN("pcUsername" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS keyboardlogs_username_trgm_idx ON "keyboardLogs" USING GIN("pcUsername" gin_trgm_ops);

-- 4. Add trigram indexes for department fuzzy matching
CREATE INDEX IF NOT EXISTS pcs_department_trgm_idx ON pcs USING GIN(department gin_trgm_ops);
CREATE INDEX IF NOT EXISTS laptops_department_trgm_idx ON laptops USING GIN(department gin_trgm_ops);
CREATE INDEX IF NOT EXISTS servers_department_trgm_idx ON servers USING GIN(department gin_trgm_ops);

-- 5. Repeat for Laptops table
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS laptops_search_idx ON laptops USING GIN(search_vector);

CREATE OR REPLACE FUNCTION laptops_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."pcName", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.department, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.cpu, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS laptops_search_vector_trigger ON laptops;
CREATE TRIGGER laptops_search_vector_trigger
BEFORE INSERT OR UPDATE ON laptops
FOR EACH ROW EXECUTE FUNCTION laptops_search_vector_update();

UPDATE laptops SET search_vector =
  setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("pcName", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(brand, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(model, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(department, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(cpu, '')), 'C');

-- 6. Create helper function for fuzzy username search with trigram similarity
CREATE OR REPLACE FUNCTION find_similar_usernames(
    search_term TEXT,
    similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE(username TEXT, similarity_score REAL, source TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (username_value)
        username_value as username,
        similarity(username_value, search_term) as similarity_score,
        source_table as source
    FROM (
        SELECT username as username_value, 'pcs' as source_table
        FROM pcs WHERE username IS NOT NULL
        UNION ALL
        SELECT username as username_value, 'laptops' as source_table
        FROM laptops WHERE username IS NOT NULL
        UNION ALL
        SELECT "pcUsername" as username_value, 'peripherals' as source_table
        FROM "mouseLogs" WHERE "pcUsername" IS NOT NULL
    ) combined
    WHERE similarity(username_value, search_term) > similarity_threshold
    ORDER BY username_value, similarity_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 7. Create helper function for smart department matching
CREATE OR REPLACE FUNCTION find_similar_departments(
    search_term TEXT,
    similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE(department TEXT, similarity_score REAL) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (dept_value)
        dept_value as department,
        similarity(dept_value, search_term) as similarity_score
    FROM (
        SELECT department as dept_value FROM pcs WHERE department IS NOT NULL
        UNION
        SELECT department as dept_value FROM laptops WHERE department IS NOT NULL
        UNION
        SELECT department as dept_value FROM servers WHERE department IS NOT NULL
    ) combined
    WHERE similarity(dept_value, search_term) > similarity_threshold
    ORDER BY dept_value, similarity_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM find_similar_usernames('karim', 0.3);
-- SELECT * FROM find_similar_departments('IT', 0.3);
-- SELECT * FROM pcs WHERE search_vector @@ to_tsquery('english', 'john & i7');

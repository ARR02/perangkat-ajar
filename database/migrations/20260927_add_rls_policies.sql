-- =============================================================================
-- RLS Policies Migration
-- Tables: User, School, Teacher, CurriculumProject, CurriculumContext,
--         CPDocument, TPDocument, ATPDocument, KKTPDocument, ProtaDocument,
--         ProsemDocument, ModulDocument, LkpdDocument, Template, TemplateField,
--         GeneratedDocument, DocumentVersion, AiGenerationLog
--
-- Access model:
--   - All data is scoped to the authenticated user who owns it.
--   - Ownership is traced via: Document → CurriculumProject.userId
--                              CurriculumContext → CurriculumProject.userId
--                              Teacher → Teacher.userId
--                              Template / TemplateField → School.ownerId
--   - AiGenerationLog is an internal audit log: no public access (service_role only).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------------
create policy "Users can view their own profile"
  on "User" for select
  to authenticated
  using ( (select auth.uid())::text = id );

create policy "Users can update their own profile"
  on "User" for update
  to authenticated
  using ( (select auth.uid())::text = id )
  with check ( (select auth.uid())::text = id );

-- Insert is handled by the auth trigger / server-side; no client INSERT needed.


-- ---------------------------------------------------------------------------
-- School
-- ---------------------------------------------------------------------------
create policy "Owners can view their schools"
  on "School" for select
  to authenticated
  using ( (select auth.uid())::text = "ownerId" );

create policy "Owners can insert schools"
  on "School" for insert
  to authenticated
  with check ( (select auth.uid())::text = "ownerId" );

create policy "Owners can update their schools"
  on "School" for update
  to authenticated
  using ( (select auth.uid())::text = "ownerId" )
  with check ( (select auth.uid())::text = "ownerId" );

create policy "Owners can delete their schools"
  on "School" for delete
  to authenticated
  using ( (select auth.uid())::text = "ownerId" );


-- ---------------------------------------------------------------------------
-- Teacher
-- ---------------------------------------------------------------------------
create policy "Users can view their own teacher profiles"
  on "Teacher" for select
  to authenticated
  using ( (select auth.uid())::text = "userId" );

create policy "Users can insert their own teacher profiles"
  on "Teacher" for insert
  to authenticated
  with check ( (select auth.uid())::text = "userId" );

create policy "Users can update their own teacher profiles"
  on "Teacher" for update
  to authenticated
  using ( (select auth.uid())::text = "userId" )
  with check ( (select auth.uid())::text = "userId" );

create policy "Users can delete their own teacher profiles"
  on "Teacher" for delete
  to authenticated
  using ( (select auth.uid())::text = "userId" );


-- ---------------------------------------------------------------------------
-- CurriculumProject
-- ---------------------------------------------------------------------------
create policy "Users can view their own projects"
  on "CurriculumProject" for select
  to authenticated
  using ( (select auth.uid())::text = "userId" );

create policy "Users can insert their own projects"
  on "CurriculumProject" for insert
  to authenticated
  with check ( (select auth.uid())::text = "userId" );

create policy "Users can update their own projects"
  on "CurriculumProject" for update
  to authenticated
  using ( (select auth.uid())::text = "userId" )
  with check ( (select auth.uid())::text = "userId" );

create policy "Users can delete their own projects"
  on "CurriculumProject" for delete
  to authenticated
  using ( (select auth.uid())::text = "userId" );


-- ---------------------------------------------------------------------------
-- CurriculumContext (1-1 with CurriculumProject)
-- ---------------------------------------------------------------------------
create policy "Users can view their own curriculum context"
  on "CurriculumContext" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "CurriculumContext"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own curriculum context"
  on "CurriculumContext" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own curriculum context"
  on "CurriculumContext" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "CurriculumContext"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own curriculum context"
  on "CurriculumContext" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "CurriculumContext"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- ---------------------------------------------------------------------------
-- Helper macro: all *Document tables share the same pattern
--   (projectId → CurriculumProject.userId)
-- ---------------------------------------------------------------------------

-- CPDocument
create policy "Users can view their own CP documents"
  on "CPDocument" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "CPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own CP documents"
  on "CPDocument" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own CP documents"
  on "CPDocument" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "CPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own CP documents"
  on "CPDocument" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "CPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- TPDocument
create policy "Users can view their own TP documents"
  on "TPDocument" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "TPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own TP documents"
  on "TPDocument" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own TP documents"
  on "TPDocument" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "TPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own TP documents"
  on "TPDocument" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "TPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- ATPDocument
create policy "Users can view their own ATP documents"
  on "ATPDocument" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ATPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own ATP documents"
  on "ATPDocument" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own ATP documents"
  on "ATPDocument" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ATPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own ATP documents"
  on "ATPDocument" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ATPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- KKTPDocument
create policy "Users can view their own KKTP documents"
  on "KKTPDocument" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "KKTPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own KKTP documents"
  on "KKTPDocument" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own KKTP documents"
  on "KKTPDocument" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "KKTPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own KKTP documents"
  on "KKTPDocument" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "KKTPDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- ProtaDocument
create policy "Users can view their own Prota documents"
  on "ProtaDocument" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ProtaDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own Prota documents"
  on "ProtaDocument" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own Prota documents"
  on "ProtaDocument" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ProtaDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own Prota documents"
  on "ProtaDocument" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ProtaDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- ProsemDocument
create policy "Users can view their own Prosem documents"
  on "ProsemDocument" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ProsemDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own Prosem documents"
  on "ProsemDocument" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own Prosem documents"
  on "ProsemDocument" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ProsemDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own Prosem documents"
  on "ProsemDocument" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ProsemDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- ModulDocument
create policy "Users can view their own Modul documents"
  on "ModulDocument" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ModulDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own Modul documents"
  on "ModulDocument" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own Modul documents"
  on "ModulDocument" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ModulDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own Modul documents"
  on "ModulDocument" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "ModulDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- LkpdDocument
create policy "Users can view their own LKPD documents"
  on "LkpdDocument" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "LkpdDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own LKPD documents"
  on "LkpdDocument" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own LKPD documents"
  on "LkpdDocument" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "LkpdDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own LKPD documents"
  on "LkpdDocument" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "LkpdDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- ---------------------------------------------------------------------------
-- Template  (scoped to school owner)
-- ---------------------------------------------------------------------------
create policy "School owners can view templates"
  on "Template" for select
  to authenticated
  using (
    exists (
      select 1 from "School" s
      where s.id = "Template"."schoolId"
        and (select auth.uid())::text = s."ownerId"
    )
  );

create policy "School owners can insert templates"
  on "Template" for insert
  to authenticated
  with check (
    exists (
      select 1 from "School" s
      where s.id = "schoolId"
        and (select auth.uid())::text = s."ownerId"
    )
  );

create policy "School owners can update templates"
  on "Template" for update
  to authenticated
  using (
    exists (
      select 1 from "School" s
      where s.id = "Template"."schoolId"
        and (select auth.uid())::text = s."ownerId"
    )
  )
  with check (
    exists (
      select 1 from "School" s
      where s.id = "schoolId"
        and (select auth.uid())::text = s."ownerId"
    )
  );

create policy "School owners can delete templates"
  on "Template" for delete
  to authenticated
  using (
    exists (
      select 1 from "School" s
      where s.id = "Template"."schoolId"
        and (select auth.uid())::text = s."ownerId"
    )
  );


-- ---------------------------------------------------------------------------
-- TemplateField  (scoped via Template → School owner)
-- ---------------------------------------------------------------------------
create policy "School owners can view template fields"
  on "TemplateField" for select
  to authenticated
  using (
    exists (
      select 1 from "Template" t
      join "School" s on s.id = t."schoolId"
      where t.id = "TemplateField"."templateId"
        and (select auth.uid())::text = s."ownerId"
    )
  );

create policy "School owners can insert template fields"
  on "TemplateField" for insert
  to authenticated
  with check (
    exists (
      select 1 from "Template" t
      join "School" s on s.id = t."schoolId"
      where t.id = "templateId"
        and (select auth.uid())::text = s."ownerId"
    )
  );

create policy "School owners can update template fields"
  on "TemplateField" for update
  to authenticated
  using (
    exists (
      select 1 from "Template" t
      join "School" s on s.id = t."schoolId"
      where t.id = "TemplateField"."templateId"
        and (select auth.uid())::text = s."ownerId"
    )
  )
  with check (
    exists (
      select 1 from "Template" t
      join "School" s on s.id = t."schoolId"
      where t.id = "templateId"
        and (select auth.uid())::text = s."ownerId"
    )
  );

create policy "School owners can delete template fields"
  on "TemplateField" for delete
  to authenticated
  using (
    exists (
      select 1 from "Template" t
      join "School" s on s.id = t."schoolId"
      where t.id = "TemplateField"."templateId"
        and (select auth.uid())::text = s."ownerId"
    )
  );


-- ---------------------------------------------------------------------------
-- GeneratedDocument  (projectId → CurriculumProject.userId)
-- ---------------------------------------------------------------------------
create policy "Users can view their own generated documents"
  on "GeneratedDocument" for select
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "GeneratedDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own generated documents"
  on "GeneratedDocument" for insert
  to authenticated
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own generated documents"
  on "GeneratedDocument" for update
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "GeneratedDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "projectId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own generated documents"
  on "GeneratedDocument" for delete
  to authenticated
  using (
    exists (
      select 1 from "CurriculumProject" p
      where p.id = "GeneratedDocument"."projectId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- ---------------------------------------------------------------------------
-- DocumentVersion  (generatedDocumentId → GeneratedDocument → project → userId)
-- ---------------------------------------------------------------------------
create policy "Users can view their own document versions"
  on "DocumentVersion" for select
  to authenticated
  using (
    exists (
      select 1 from "GeneratedDocument" gd
      join "CurriculumProject" p on p.id = gd."projectId"
      where gd.id = "DocumentVersion"."generatedDocumentId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can insert their own document versions"
  on "DocumentVersion" for insert
  to authenticated
  with check (
    exists (
      select 1 from "GeneratedDocument" gd
      join "CurriculumProject" p on p.id = gd."projectId"
      where gd.id = "generatedDocumentId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can update their own document versions"
  on "DocumentVersion" for update
  to authenticated
  using (
    exists (
      select 1 from "GeneratedDocument" gd
      join "CurriculumProject" p on p.id = gd."projectId"
      where gd.id = "DocumentVersion"."generatedDocumentId"
        and (select auth.uid())::text = p."userId"
    )
  )
  with check (
    exists (
      select 1 from "GeneratedDocument" gd
      join "CurriculumProject" p on p.id = gd."projectId"
      where gd.id = "generatedDocumentId"
        and (select auth.uid())::text = p."userId"
    )
  );

create policy "Users can delete their own document versions"
  on "DocumentVersion" for delete
  to authenticated
  using (
    exists (
      select 1 from "GeneratedDocument" gd
      join "CurriculumProject" p on p.id = gd."projectId"
      where gd.id = "DocumentVersion"."generatedDocumentId"
        and (select auth.uid())::text = p."userId"
    )
  );


-- ---------------------------------------------------------------------------
-- AiGenerationLog
--   Internal audit/observability table — no direct access from client.
--   All writes go through server-side code (service_role).
--   No policies means RLS blocks all client access by default.
-- ---------------------------------------------------------------------------
-- (intentionally left empty — service_role bypasses RLS automatically)

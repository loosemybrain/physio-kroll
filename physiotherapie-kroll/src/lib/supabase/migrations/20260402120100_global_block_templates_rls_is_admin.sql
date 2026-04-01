-- Harte RLS für global_block_templates (nur DB-Admins, nicht jedes authenticated)

ALTER TABLE public.global_block_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_block_templates FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin full access global_block_templates" ON public.global_block_templates;
DROP POLICY IF EXISTS global_block_templates_select_admin ON public.global_block_templates;
DROP POLICY IF EXISTS global_block_templates_insert_admin ON public.global_block_templates;
DROP POLICY IF EXISTS global_block_templates_update_admin ON public.global_block_templates;
DROP POLICY IF EXISTS global_block_templates_delete_admin ON public.global_block_templates;

CREATE POLICY global_block_templates_select_admin
ON public.global_block_templates
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY global_block_templates_insert_admin
ON public.global_block_templates
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY global_block_templates_update_admin
ON public.global_block_templates
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY global_block_templates_delete_admin
ON public.global_block_templates
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

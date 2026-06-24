-- Permite 'other' (otra persona) en enrollments.student_type
ALTER TABLE "public"."enrollments" DROP CONSTRAINT IF EXISTS "enrollments_student_type_check";
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_student_type_check"
  CHECK (("student_type" = ANY (ARRAY['self'::"text", 'child'::"text", 'other'::"text"])));

import { apiError, apiSuccess } from "@/lib/api/response";
import { getPublicForm, recordFormView } from "@/lib/crm/form-submission-service";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const { form, fields } = await getPublicForm(token);
    await recordFormView(form.id);
    return apiSuccess({
      name: form.name,
      description: form.description,
      successMessage: form.successMessage,
      fields: fields.map((f) => ({
        key: f.fieldKey,
        label: f.label,
        type: f.fieldType,
        required: f.required,
        options: f.options,
      })),
    });
  } catch {
    return apiError("Form not found or inactive", 404, "NOT_FOUND");
  }
}

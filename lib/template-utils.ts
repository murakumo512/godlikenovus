export function renderWhatsappTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;
  for (const [key, rawVal] of Object.entries(variables)) {
    const val =
      rawVal === undefined || rawVal === null || String(rawVal).trim() === ""
        ? "-"
        : String(rawVal);
    const pattern = new RegExp(`\\{${key}\\}`, "gi");
    result = result.replace(pattern, val);
  }
  return result;
}

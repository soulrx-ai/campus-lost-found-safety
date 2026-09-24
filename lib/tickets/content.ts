export const RESOLUTION_DELIMITER = "\n\n--- [STAFF_RESOLUTION] ---\n";

/**
 * Combines original ticket description with staff troubleshooting / resolution note.
 */
export function formatTicketWithResolution(
  originalDescription: string,
  staffNote: string
): string {
  const cleanDescription = (originalDescription || "").split(RESOLUTION_DELIMITER)[0].trim();
  const cleanNote = staffNote.trim();
  if (!cleanNote) return cleanDescription;
  return `${cleanDescription}${RESOLUTION_DELIMITER}${cleanNote}`;
}

/**
 * Parses ticket description and staff_note to return clean user description and staff resolution note.
 */
export function parseTicketContent(
  description: string,
  staffNote?: string | null
): { userDescription: string; staffResolution: string | null } {
  // 1. If dedicated staff_note field has content, prioritize it
  if (staffNote && staffNote.trim()) {
    const cleanUserDesc = (description || "").split(RESOLUTION_DELIMITER)[0].trim();
    return {
      userDescription: cleanUserDesc || description,
      staffResolution: staffNote.trim(),
    };
  }

  // 2. If embedded in description via delimiter
  if (description && description.includes(RESOLUTION_DELIMITER)) {
    const [userDesc, ...resParts] = description.split(RESOLUTION_DELIMITER);
    const resolvedNote = resParts.join(RESOLUTION_DELIMITER).trim();
    return {
      userDescription: userDesc.trim(),
      staffResolution: resolvedNote || null,
    };
  }

  // 3. Standard description without note
  return {
    userDescription: description || "",
    staffResolution: null,
  };
}

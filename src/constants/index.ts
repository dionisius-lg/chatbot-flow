// ============================================================================
// Flow Type & Dialog Type Constants
// ============================================================================
// Maps flow type and dialog type IDs to human-readable labels and UI colors.
// Used as a fallback when the API does not provide type metadata.
// ============================================================================

// Flow type ID -> label, text color, background color
export const FLOW_TYPES: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Normal', color: '#16a34a', bg: '#dcfce7' },
    2: { label: 'Direct Agent', color: '#2563eb', bg: '#dbeafe' },
    3: { label: 'Close Ticket', color: '#dc2626', bg: '#fee2e2' },
    4: { label: 'Invalid', color: '#d97706', bg: '#fef3c7' },
    5: { label: 'Timeout', color: '#6b7280', bg: '#f3f4f6' },
};

// Dialog type ID -> label and whether it supports options (for branching)
export const DIALOG_TYPES: Record<number, { label: string; hasOptions: boolean }> = {
    1: { label: 'Text', hasOptions: false },
    2: { label: 'Reply List', hasOptions: true },
    3: { label: 'Reply Button', hasOptions: true },
    4: { label: 'Text Menu', hasOptions: true },
    5: { label: 'Text Ask Data', hasOptions: false },
    6: { label: 'Media', hasOptions: false },
    7: { label: 'Text Pre Ask Data', hasOptions: false },
};

// Media ID -> Label
export const MEDIA_LABELS: Record<string, string> = {
    '4': 'WhatsApp',
    '5': 'Facebook Message',
    '13': 'Instagram Message',
    '18': 'Live Chat',
};

// Media options for form dropdowns
export const MEDIA_OPTIONS = [
    { id: '4', name: 'WhatsApp' },
    { id: '5', name: 'Facebook Message' },
    { id: '13', name: 'Instagram Message' },
    { id: '18', name: 'Live Chat' },
];

export function getMediaLabel(mediaId: string): string {
    return MEDIA_LABELS[mediaId] || `Media #${mediaId}`;
}

/**
 * Returns allowed dialog type IDs based on the parent flow type ID and media conditions.
 * - Direct Agent (2) & Close Ticket (3): Text (1), Text Ask Data (5), Media (6)
 * - Invalid (4): Text (1), Media (6)
 * - Timeout (5): Text (1), Reply List (2), Reply Button (3), Text Menu (4), Media (6)
 * - Normal (1) & others: all dialog types (1..7)
 * - If isSocmed is true (FB / IG), Reply List (2) and Reply Button (3) are excluded across all flow types.
 */
export function getAllowedDialogTypes(flowTypeId: number, isSocmed: boolean = false): number[] {
    let allowed: number[];
    if (flowTypeId === 2 || flowTypeId === 3) {
        allowed = [1, 5, 6];
    } else if (flowTypeId === 4) {
        allowed = [1, 6];
    } else if (flowTypeId === 5) {
        allowed = [1, 2, 3, 4, 6];
    } else {
        allowed = [1, 2, 3, 4, 5, 6, 7];
    }

    if (isSocmed) {
        return allowed.filter((id) => id !== 2 && id !== 3);
    }

    return allowed;
}


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

import { translate, type Language, type TranslationKey } from "./translations";

// Display only: callers must continue using raw values for all application logic.
const displayKeys = {
  USER: "User", STAFF: "Staff", ADMIN: "Admin",
  LOST: "Lost", FOUND: "Found",
  PENDING_REVIEW: "Pending Review", PUBLISHED: "Published", HIDDEN: "Hidden",
  APPROVED: "Approved", REJECTED: "Rejected", COMPLETED: "Completed",
  CLAIMED: "Claimed", RETURNED: "Returned", CLOSED: "Closed",
  OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved",
  ACTIVE: "Active", INACTIVE: "Inactive",
  NOT_RECEIVED: "Item Not Received", SYSTEM_PROBLEM: "System Problem", GENERAL: "General Inquiry",
  ITEM: "Item", CLAIM: "Claim", SAFETY: "Safety", SERVICE_TICKET: "Service Ticket", SYSTEM: "System",
  Electronics: "Electronics", Wallet: "Wallet", Bag: "Bag", Document: "Document",
  Clothing: "Clothing", Accessory: "Accessory", Other: "Other",
} as const satisfies Record<string, TranslationKey>;

export function displayValue(language: Language, value: string): string {
  if (Object.prototype.hasOwnProperty.call(displayKeys, value)) {
    return translate(language, displayKeys[value as keyof typeof displayKeys]);
  }
  return value;
}

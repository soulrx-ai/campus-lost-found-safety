export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    public: {
        Tables: {
            activity_logs: {
                Row: { action: string; actor_id: string; created_at: string; details: Json | null; entity_id: string | null; entity_type: string; id: string }
                Insert: { action: string; actor_id: string; created_at?: string; details?: Json | null; entity_id?: string | null; entity_type: string; id?: string }
                Update: { action?: string; actor_id?: string; created_at?: string; details?: Json | null; entity_id?: string | null; entity_type?: string; id?: string }
                Relationships: []
            }
            claims: {
                Row: { claim_reason: string; claimant_id: string; created_at: string; evidence: string | null; handover_at: string | null; handover_confirmed_by: string | null; handover_photo_url: string | null; id: string; item_id: string; reviewed_at: string | null; reviewed_by: string | null; staff_note: string | null; status: string; updated_at: string }
                Insert: { claim_reason: string; claimant_id: string; created_at?: string; evidence?: string | null; handover_at?: string | null; handover_confirmed_by?: string | null; handover_photo_url?: string | null; id?: string; item_id: string; reviewed_at?: string | null; reviewed_by?: string | null; staff_note?: string | null; status?: string; updated_at?: string }
                Update: { claim_reason?: string; claimant_id?: string; created_at?: string; evidence?: string | null; handover_at?: string | null; handover_confirmed_by?: string | null; handover_photo_url?: string | null; id?: string; item_id?: string; reviewed_at?: string | null; reviewed_by?: string | null; staff_note?: string | null; status?: string; updated_at?: string }
                Relationships: []
            }
            item_categories: {
                Row: { created_at: string; id: string; is_active: boolean; name: string }
                Insert: { created_at?: string; id?: string; is_active?: boolean; name: string }
                Update: { created_at?: string; id?: string; is_active?: boolean; name?: string }
                Relationships: []
            }
            items: {
                Row: { brand: string | null; category: string; color: string | null; created_at: string; date_time: string; description: string | null; id: string; image_url: string; location: string; name: string; report_type: string; reporter_id: string; reviewed_at: string | null; reviewed_by: string | null; status: string; updated_at: string }
                Insert: { brand?: string | null; category: string; color?: string | null; created_at?: string; date_time: string; description?: string | null; id?: string; image_url: string; location: string; name: string; report_type: string; reporter_id: string; reviewed_at?: string | null; reviewed_by?: string | null; status?: string; updated_at?: string }
                Update: { brand?: string | null; category?: string; color?: string | null; created_at?: string; date_time?: string; description?: string | null; id?: string; image_url?: string; location?: string; name?: string; report_type?: string; reporter_id?: string; reviewed_at?: string | null; reviewed_by?: string | null; status?: string; updated_at?: string }
                Relationships: []
            }
            notifications: {
                Row: { created_at: string; id: string; is_read: boolean; message: string; title: string; type: string; user_id: string }
                Insert: { created_at?: string; id?: string; is_read?: boolean; message: string; title: string; type: string; user_id: string }
                Update: { created_at?: string; id?: string; is_read?: boolean; message?: string; title?: string; type?: string; user_id?: string }
                Relationships: []
            }
            profiles: {
                Row: { created_at: string; full_name: string; id: string; phone: string | null; role: string; status: string }
                Insert: { created_at?: string; full_name: string; id: string; phone?: string | null; role?: string; status?: string }
                Update: { created_at?: string; full_name?: string; id?: string; phone?: string | null; role?: string; status?: string }
                Relationships: []
            }
            security_incidents: {
                Row: { created_at: string; description: string; id: string; image_url: string; incident_time: string; location: string; reporter_id: string; reviewed_at: string | null; reviewed_by: string | null; status: string; title: string; updated_at: string }
                Insert: { created_at?: string; description: string; id?: string; image_url: string; incident_time: string; location: string; reporter_id: string; reviewed_at?: string | null; reviewed_by?: string | null; status?: string; title: string; updated_at?: string }
                Update: { created_at?: string; description?: string; id?: string; image_url?: string; incident_time?: string; location?: string; reporter_id?: string; reviewed_at?: string | null; reviewed_by?: string | null; status?: string; title?: string; updated_at?: string }
                Relationships: []
            }
            service_tickets: {
                Row: { assigned_to: string | null; claim_id: string | null; created_at: string; description: string; id: string; requester_id: string; resolved_at: string | null; staff_note: string | null; status: string; subject: string; ticket_type: string; updated_at: string }
                Insert: { assigned_to?: string | null; claim_id?: string | null; created_at?: string; description: string; id?: string; requester_id: string; resolved_at?: string | null; staff_note?: string | null; status?: string; subject: string; ticket_type: string; updated_at?: string }
                Update: { assigned_to?: string | null; claim_id?: string | null; created_at?: string; description?: string; id?: string; requester_id?: string; resolved_at?: string | null; staff_note?: string | null; status?: string; subject?: string; ticket_type?: string; updated_at?: string }
                Relationships: []
            }
        }
        Views: { [_ in never]: never }

        Functions: {
            get_my_role: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            update_my_profile: {
                Args: {
                    p_full_name: string
                    p_phone: string
                }
                Returns: undefined
            }
            review_claim: {
                Args: {
                    p_claim_id: string
                    p_new_status: string
                    p_staff_note?: string | null
                }
                Returns: undefined
            }

            complete_claim_handover: {
                Args: {
                    p_claim_id: string
                    p_handover_photo_url: string
                }
                Returns: undefined
            }
            rename_item_category: {
                Args: {
                    p_category_id: string
                    p_new_name: string
                }
                Returns: undefined
            }
            update_item_category: {
                Args: {
                    p_category_id: string
                    p_is_active: boolean
                    p_new_name: string
                }
                Returns: undefined
            }
        }

        Enums: { [_ in never]: never }

        CompositeTypes: { [_ in never]: never }
    }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

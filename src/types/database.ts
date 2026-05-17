export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          business_type: string;
          industry_subtype: string | null;
          plan: string;
          contact_name: string | null;
          contact_email: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["tenants"]["Row"]> & {
          name: string;
          business_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Row"]>;
      };
      roles: {
        Row: {
          id: string;
          tenant_id: string | null;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["roles"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["roles"]["Row"]>;
      };
      users: {
        Row: {
          id: string;
          tenant_id: string | null;
          user_code: string | null;
          name: string | null;
          email: string;
          email_verified: string | null;
          password_hash: string | null;
          image: string | null;
          role_id: string | null;
          designation_id: string | null;
          department: string | null;
          branch_id: string | null;
          status: string;
          joined_at: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { email: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      branches: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          code: string;
          description: string | null;
          office_type: string;
          country: string;
          state: string;
          city: string;
          address: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["branches"]["Row"]> & {
          tenant_id: string;
          name: string;
          code: string;
          country: string;
          state: string;
          city: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Row"]>;
      };
      divisions: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          code: string;
          description: string | null;
          modules_assigned: string[];
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["divisions"]["Row"]> & {
          tenant_id: string;
          name: string;
          code: string;
        };
        Update: Partial<Database["public"]["Tables"]["divisions"]["Row"]>;
      };
      designations: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["designations"]["Row"]> & {
          tenant_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["designations"]["Row"]>;
      };
      user_permissions: {
        Row: {
          id: string;
          user_id: string;
          module: string;
          feature: string;
          enabled: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["user_permissions"]["Row"]> & {
          user_id: string;
          module: string;
          feature: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_permissions"]["Row"]>;
      };
    };
  };
};

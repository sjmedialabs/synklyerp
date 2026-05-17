import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { DEFAULT_DESIGNATIONS } from "../src/constants/roles";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function main() {
  const superEmail = process.env.SUPER_ADMIN_EMAIL ?? "bizflow@admin.io";
  const superPass = process.env.SUPER_ADMIN_PASSWORD ?? "Synkly@2026!";
  const hash = await bcrypt.hash(superPass, 12);

  const { data: superRole } = await supabase
    .from("roles")
    .upsert({ id: "00000000-0000-0000-0000-000000000001", name: "SUPERADMIN", is_system: true, description: "Platform admin" }, { onConflict: "id" })
    .select()
    .single();

  await supabase.from("users").upsert({
    email: superEmail,
    name: "Super Admin",
    password_hash: hash,
    role_id: superRole?.id,
    status: "ACTIVE",
  }, { onConflict: "email" });

  const { data: tenant } = await supabase
    .from("tenants")
    .upsert({
      id: "00000000-0000-0000-0000-000000000010",
      name: "Synkly Demo Corp",
      business_type: "Hybrid",
      industry_subtype: "IT Services",
      plan: "ENTERPRISE",
      contact_name: "John Doe",
      contact_email: "admin@synklydemo.io",
      status: "ACTIVE",
    }, { onConflict: "id" })
    .select()
    .single();

  if (!tenant) throw new Error("Tenant seed failed");

  const { data: adminRole } = await supabase
    .from("roles")
    .upsert({ id: "00000000-0000-0000-0000-000000000011", tenant_id: tenant.id, name: "ADMIN", description: "Business admin" }, { onConflict: "id" })
    .select()
    .single();

  const adminHash = await bcrypt.hash("Synkly@2026!", 12);
  await supabase.from("users").upsert({
    email: "admin@synklydemo.io",
    name: "John Doe",
    user_code: "USR-001",
    password_hash: adminHash,
    tenant_id: tenant.id,
    role_id: adminRole?.id,
    status: "ACTIVE",
  }, { onConflict: "email" });

  for (const name of DEFAULT_DESIGNATIONS) {
    await supabase.from("designations").upsert({ tenant_id: tenant.id, name, status: "ACTIVE" }, { onConflict: "tenant_id,name" });
  }

  await supabase.from("branches").upsert({
    tenant_id: tenant.id,
    name: "Headquarters",
    code: "HQ-001",
    office_type: "Primary",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    address: "MG Road",
    status: "ACTIVE",
  }, { onConflict: "tenant_id,code" });

  await supabase.from("divisions").upsert({
    tenant_id: tenant.id,
    name: "Engineering",
    code: "ENG-001",
    modules_assigned: ["HR", "Finance", "Sales", "Projects"],
    status: "ACTIVE",
  }, { onConflict: "tenant_id,code" });

  const { data: adminUser } = await supabase.from("users").select("id").eq("email", "admin@synklydemo.io").single();
  const { data: superUser } = await supabase.from("users").select("id").eq("email", superEmail).single();

  const perms = [
    { module: "organisation", feature: "branches", action: "read" },
    { module: "hr", feature: "employees", action: "write" },
    { module: "finance", feature: "services", action: "read" },
  ];
  for (const p of perms) {
    await supabase.from("permissions").upsert(p, { onConflict: "module,feature,action" });
  }

  if (adminUser?.id) {
    for (const n of [
      { type: "info", title: "Welcome to SynklyERP", message: "Your workspace is ready. Explore Organisation, HR, and Finance modules." },
      { type: "success", title: "Seed complete", message: "Demo data for branches, designations, and divisions has been loaded." },
    ]) {
      await supabase.from("notifications").insert({
        tenant_id: tenant.id,
        user_id: adminUser.id,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: false,
      });
    }
    await supabase.from("activity_logs").insert({
      tenant_id: tenant.id,
      user_id: adminUser.id,
      module: "system",
      action: "seed",
      entity_type: "tenant",
      entity_id: tenant.id,
      payload: { message: "Demo tenant seeded" },
    });
  }

  if (superUser?.id) {
    await supabase.from("notifications").insert({
      user_id: superUser.id,
      type: "info",
      title: "Super Admin Console",
      message: "Platform administration is available at /superadmin.",
      is_read: false,
    });
  }

  console.log("Seed complete.");
  console.log(`  Super Admin: ${superEmail} / ${superPass}`);
  console.log("  Tenant Admin: admin@synklydemo.io / Synkly@2026!");
}

main().catch((e) => { console.error(e); process.exit(1); });

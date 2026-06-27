import { ErpFeatureManager } from "@/components/superadmin/erp-feature-manager";

export default function ErpFeaturesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ERP Features (Menu Master)</h1>
        <p className="mt-1 max-w-3xl text-slate-600">
          Master list of all sidebar menus and submenus. Enable or disable globally, then assign subsets to each
          business category. Matches the tenant left navigation structure.
        </p>
      </div>
      <ErpFeatureManager />
    </div>
  );
}

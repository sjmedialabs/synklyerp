/** Mini UI previews for platform feature cards */

export function MockHR() {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-inner">
      <div className="mb-2 flex gap-2">
        <div className="h-8 w-8 rounded-full bg-violet-200" />
        <div className="flex-1 space-y-1">
          <div className="h-2 w-24 rounded bg-slate-300" />
          <div className="h-2 w-16 rounded bg-slate-200" />
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Active</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {["Present", "Late", "Leave"].map((l, i) => (
          <div key={l} className={`rounded px-1 py-2 text-center text-[9px] font-medium ${i === 0 ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-500"}`}>{l}</div>
        ))}
      </div>
    </div>
  );
}

export function MockFinance() {
  return (
    <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-inner">
      {["Consulting", "Implementation", "Support SLA"].map((s, i) => (
        <div key={s} className="flex items-center justify-between text-[10px]">
          <span className="text-slate-700">{s}</span>
          <span className="font-semibold text-emerald-600">₹{(i + 1) * 12500}</span>
        </div>
      ))}
    </div>
  );
}

export function MockOrg() {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-inner">
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-700">HQ</span>
        <span>→</span>
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">ENG</span>
        <span>→</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5">12 users</span>
      </div>
      <div className="mt-2 h-16 rounded bg-gradient-to-r from-indigo-50 to-blue-50" />
    </div>
  );
}

export function MockSales() {
  return (
    <div className="mt-4 flex gap-1">
      {["Fresh", "Qualified", "Won"].map((s, i) => (
        <div key={s} className="flex-1 rounded-lg bg-orange-50 p-2 text-center">
          <p className="text-[9px] text-orange-600">{s}</p>
          <p className="text-sm font-bold text-orange-800">{[8, 5, 3][i]}</p>
        </div>
      ))}
    </div>
  );
}

export function MockProjects() {
  return (
    <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-inner">
      <div className="flex justify-between text-[10px]">
        <span className="font-medium text-slate-700">Website Redesign</span>
        <span className="text-rose-600">72%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
      </div>
    </div>
  );
}

export function MockPlatform() {
  return (
    <div className="mt-4 space-y-1.5 rounded-lg border border-slate-200 bg-slate-900 p-3 shadow-inner">
      {["Login audit", "New lead assigned", "Payroll cycle due"].map((n) => (
        <div key={n} className="flex items-center gap-2 rounded bg-slate-800 px-2 py-1.5 text-[9px] text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          {n}
        </div>
      ))}
    </div>
  );
}

const mocks = {
  hr: MockHR,
  finance: MockFinance,
  org: MockOrg,
  sales: MockSales,
  projects: MockProjects,
  platform: MockPlatform,
};

export function FeatureMock({ type }: { type: keyof typeof mocks }) {
  const C = mocks[type];
  return <C />;
}

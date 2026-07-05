"use client";

import { useMemo, useState } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOrgUsers } from "@/hooks/organisation";

type Props = {
  value: string | null;
  displayLabel?: string | null;
  onChange: (userId: string | null) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
};

export function AccountManagerSelect({ value, displayLabel, onChange, disabled, compact, className }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const { data: users = [], isLoading } = useOrgUsers(debouncedSearch, "ACTIVE");

  const options = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name ?? u.email,
        sublabel: u.designation?.name ?? u.email,
      })),
    [users]
  );

  return (
    <SearchableSelect
      value={value}
      displayLabel={displayLabel}
      onChange={onChange}
      options={options}
      placeholder="Select manager"
      searchPlaceholder="Search users…"
      loading={isLoading}
      disabled={disabled}
      compact={compact}
      className={className}
      onSearchChange={setSearchInput}
      allowClear
      clearLabel="Unassigned"
    />
  );
}

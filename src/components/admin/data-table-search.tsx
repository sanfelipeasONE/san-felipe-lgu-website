"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface DataTableSearchProps {
  placeholder?: string;
  defaultValue?: string;
  paramName?: string;
}

export function DataTableSearch({
  placeholder = "Search records...",
  defaultValue = "",
  paramName = "search",
}: DataTableSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(defaultValue);
  const [prevDefaultValue, setPrevDefaultValue] = React.useState(defaultValue);

  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    setValue(defaultValue);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const trimmed = value.trim();
    if (trimmed) {
      params.set(paramName, trimmed);
    } else {
      params.delete(paramName);
    }
    params.delete("page"); // Reset pagination to page 1 on new query
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 min-w-[200px] max-w-sm">
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8 h-8 text-xs bg-slate-50 border-gray-300 focus:bg-white"
      />
    </form>
  );
}

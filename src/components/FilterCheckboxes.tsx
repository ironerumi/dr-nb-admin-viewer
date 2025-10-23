import React from "react";
import { Checkbox } from "./ui/checkbox";

export interface FilterState {
  codespaceOnly: boolean;
  oneMonthOld: boolean;
  running: boolean;
}

interface FilterCheckboxesProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export const FilterCheckboxes: React.FC<FilterCheckboxesProps> = ({
  filters,
  onChange,
}) => {
  return (
    <div className="flex gap-6 mb-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="codespace-only"
          checked={filters.codespaceOnly}
          onCheckedChange={(checked) =>
            onChange({ ...filters, codespaceOnly: checked as boolean })
          }
        />
        <label
          htmlFor="codespace-only"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Codespaceのみ
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="one-month-old"
          checked={filters.oneMonthOld}
          onCheckedChange={(checked) =>
            onChange({ ...filters, oneMonthOld: checked as boolean })
          }
        />
        <label
          htmlFor="one-month-old"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          1ヶ月以上未使用
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="running"
          checked={filters.running}
          onCheckedChange={(checked) =>
            onChange({ ...filters, running: checked as boolean })
          }
        />
        <label
          htmlFor="running"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          使用中
        </label>
      </div>
    </div>
  );
};

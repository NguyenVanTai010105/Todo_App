import React from "react";
import { Badge } from "./ui/badge";
import { FilterType } from "@/lib/data";
import { Filter } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const StatsAndFilters = ({
  completedTasksCount = 0,
  activeTasksCount = 0,
  filter = "all",
  setFilter,
}) => {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      {/* phần thống kê */}
      <div className="flex gap-3">
        <Badge
          variant="secondary"
          className="bg-white/50 text-accent-foreground border-info/20"
        >
          {activeTasksCount} {FilterType.active}
        </Badge>
        <Badge
          variant="secondary"
          className="bg-white/50 text-success border-success/20"
        >
          {completedTasksCount} {FilterType.completed}
        </Badge>
      </div>

      {/* phần filter */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {Object.keys(FilterType).map((type) => (
          <Button
            key={type}
            variant={filter === type ? "gradient" : "ghost"}
            size="sm"
            className={cn(
              "cursor-pointer capitalize transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm",
              filter !== type && "hover:bg-primary/10 hover:text-primary",
              filter === type &&
                "ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
            )}
            onClick={() => setFilter(type)}
          >
            <Filter className="size-4" />
            {FilterType[type]}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StatsAndFilters;

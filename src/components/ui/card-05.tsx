import { DollarSignIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Card05() {
  return (
    <Card className="relative w-full max-w-xs">
      <div className="absolute top-6 right-6">
        <div className="bg-surface-container-low flex size-9 items-center justify-center rounded-lg">
          <DollarSignIcon className="text-text-muted size-4" />
        </div>
      </div>
      <CardHeader>
        <CardDescription>Total revenue</CardDescription>
        <CardTitle className="text-2xl tabular-nums">$48,231.89</CardTitle>
      </CardHeader>
      <div className="flex items-center gap-2 px-6 pb-6 text-xs text-text-muted">
        <Badge
          variant="secondary"
          className="text-emerald-600 bg-semantic-green-soft border border-semantic-green/20"
        >
          <TrendingUpIcon className="size-3 mr-1" />
          +20.1%
        </Badge>
        <span>vs. last month</span>
      </div>
    </Card>
  );
}

export default Card05;

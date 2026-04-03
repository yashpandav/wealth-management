import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatCardProps {
    title: string;
    value: string | number | React.ReactNode;
    icon: LucideIcon;
    subValue?: string | React.ReactNode;
    status?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    onClick?: () => void;
    href?: React.ComponentProps<typeof Link>['href'];
    className?: string;
    loading?: boolean;
}

const statusConfig = {
    default: { value: "text-brand-blue",  icon: "text-brand-blue/60" },
    success: { value: "text-emerald-600", icon: "text-emerald-500"   },
    warning: { value: "text-amber-600",   icon: "text-amber-500"     },
    danger:  { value: "text-red-600",     icon: "text-red-500"       },
    info:    { value: "text-blue-600",    icon: "text-blue-500"      },
    neutral: { value: "text-gray-600",    icon: "text-gray-400"      },
};

export function StatCard({
    title,
    value,
    icon: Icon,
    subValue,
    status = "default",
    trend,
    trendValue,
    onClick,
    href,
    className,
    loading = false,
}: StatCardProps) {
    const cfg = statusConfig[status];

    const Content = (
        <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
                <CardTitle className="text-[0.7rem] tracking-wide uppercase font-optima text-gray-500">
                    {title}
                </CardTitle>
                <Icon className={cn("h-4 w-4 shrink-0", cfg.icon)} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
                {loading ? (
                    <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
                ) : (
                    <div className={cn("text-2xl font-bold truncate font-nums", cfg.value)}>
                        {value}
                    </div>
                )}
                {(subValue || trendValue) && (
                    <div className="flex items-center mt-1 gap-2">
                        {trend && trendValue && (
                            <span
                                className={cn(
                                    "text-xs font-medium font-nums",
                                    trend === "up"   ? "text-emerald-600" :
                                    trend === "down" ? "text-red-600"     : "text-gray-500",
                                )}
                            >
                                {trend === "up" ? "+" : trend === "down" ? "−" : ""}
                                {trendValue}
                            </span>
                        )}
                        {subValue && (
                            <p className="text-xs text-muted-foreground truncate font-optima">
                                {subValue}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </>
    );

    const cardClasses = cn(
        "border-gray-200 transition-all duration-200 hover:shadow-md",
        (onClick || href) && "cursor-pointer",
        className,
    );

    if (href) {
        return (
            <Link href={href} className={cn("block", className)}>
                <Card className={cn("h-full", cardClasses)}>{Content}</Card>
            </Link>
        );
    }

    return (
        <Card className={cardClasses} onClick={onClick}>
            {Content}
        </Card>
    );
}

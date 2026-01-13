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
    const getStatusColor = (status: string) => {
        switch (status) {
            case "success":
                return "text-emerald-600";
            case "warning":
                return "text-amber-600";
            case "danger":
                return "text-red-600";
            case "info":
                return "text-blue-600";
            case "neutral":
                return "text-gray-600";
            default:
                return "text-brand-blue";
        }
    };

    const statusColorClass = getStatusColor(status);

    const Content = (
        <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-gray-600">
                    {title}
                </CardTitle>
                <div className="p-1.5">
                    <Icon
                        className={cn(
                            "h-5 w-5",
                            status === "default" ? "text-gray-500" : statusColorClass,
                        )}
                    />
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                {loading ? (
                    <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
                ) : (
                    <div className={cn("text-2xl font-bold truncate font-nums", statusColorClass)}>
                        {value}
                    </div>
                )}
                {(subValue || trendValue) && (
                    <div className="flex items-center mt-1 space-x-2">
                        {trend && (
                            <span
                                className={cn(
                                    "text-xs font-medium flex items-center font-nums",
                                    trend === "up"
                                        ? "text-emerald-600"
                                        : trend === "down"
                                            ? "text-red-600"
                                            : "text-gray-600",
                                )}
                            >
                                {trend === "up" ? "+" : trend === "down" ? "-" : ""}
                                {trendValue}
                            </span>
                        )}
                        {subValue && (
                            <p className="text-xs text-muted-foreground truncate font-medium">
                                {subValue}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </>
    );

    const cardClasses = cn(
        "border-gray-200 transition-all duration-200 hover:shadow-sm",
        (onClick || href) && "cursor-pointer hover:border-gray-300",
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

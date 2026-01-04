import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    className?: string;
    size?: number;
    text?: string;
    fullScreen?: boolean;
    centered?: boolean;
}

export function LoadingSpinner({
    className,
    size = 32,
    text,
    fullScreen,
    centered = true
}: LoadingSpinnerProps) {
    const innerContent = (
        <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-brand-blue" size={size} />
            {text && <p className="text-sm text-brand-grey font-georgia animate-pulse">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm", className)}>
                {innerContent}
            </div>
        );
    }

    if (centered) {
        return (
            <div className={cn("flex w-full items-center justify-center py-12", className)}>
                {innerContent}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-center gap-3", className)}>
            <Loader2 className="animate-spin text-brand-blue" size={size} />
            {text && <p className="text-sm text-brand-grey font-georgia animate-pulse">{text}</p>}
        </div>
    );
}

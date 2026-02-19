import { cn } from "@/lib/utils";

function GoldSkeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-gradient-to-r from-gold/10 via-gold/20 to-gold/10 bg-[length:200%_100%] animate-shimmer",
                className
            )}
            {...props}
        />
    );
}

export { GoldSkeleton };

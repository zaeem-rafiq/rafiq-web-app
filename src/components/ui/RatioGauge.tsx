import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RatioGaugeProps {
    value: number;
    threshold: number;
    label: string;
    unit?: string;
    size?: number;
    pass: boolean;
}

export function RatioGauge({
    value,
    threshold,
    label,
    unit = "<",
    size = 120,
    pass,
}: RatioGaugeProps) {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / (threshold * 1.5), 1); // Scale progress relative to threshold (max 150% of threshold)
    const strokeDashoffset = circumference - progress * circumference;

    const colorClass = pass ? "text-halal" : "text-haram";
    const glowClass = pass ? "shadow-glow-halal" : "shadow-glow-haram";

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background Circle */}
                <svg className="h-full w-full -rotate-90 transform">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        className="text-muted/20"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className={cn(colorClass, "drop-shadow-md")}
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-2xl font-bold font-heading", colorClass)}>
                        {value}%
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                        Max {threshold}%
                    </span>
                </div>
            </div>

            {/* Label */}
            <h3 className="mt-3 font-medium text-sm text-foreground/90">{label}</h3>
        </div>
    );
}

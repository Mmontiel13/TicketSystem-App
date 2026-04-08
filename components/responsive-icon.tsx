import { cn } from "@/lib/utils";
import type { LucideProps } from "lucide-react";

interface ResponsiveIconProps extends Omit<LucideProps, "size"> {
  icon: React.ElementType;
  smSize?: number;
  mdSize?: number;
  className?: string;
}

/**
 * Renders two icon instances: one visible on small screens and one on sm+ screens.
 * Eliminates the repeated pattern of rendering the same icon twice with sm:hidden / hidden sm:block.
 */
export function ResponsiveIcon({
  icon: Icon,
  smSize = 16,
  mdSize = 20,
  className,
  ...props
}: ResponsiveIconProps) {
  return (
    <>
      <Icon size={smSize} className={cn("sm:hidden", className)} {...props} />
      <Icon size={mdSize} className={cn("hidden sm:block", className)} {...props} />
    </>
  );
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  // Common icons used in the project
  export const ArrowRight: LucideIcon;
  export const BarChart3: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const ChevronDownIcon: LucideIcon;
  export const Cookie: LucideIcon;
  export const Database: LucideIcon;
  export const Eye: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const FileText: LucideIcon;
  export const Github: LucideIcon;
  export const Globe: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Home: LucideIcon;
  export const Info: LucideIcon;
  export const Loader2: LucideIcon;
  export const Lock: LucideIcon;
  export const LogOut: LucideIcon;
  export const Menu: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const ScrollText: LucideIcon;
  export const Settings: LucideIcon;
  export const Shield: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Target: LucideIcon;
  export const Trophy: LucideIcon;
  export const Twitter: LucideIcon;
  export const User: LucideIcon;
  export const UserCheck: LucideIcon;
  export const Users: LucideIcon;
  export const X: LucideIcon;
  export const XCircle: LucideIcon;
  export const Zap: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Calendar: LucideIcon;
  export const Clock: LucideIcon;
  export const Download: LucideIcon;
  export const Edit: LucideIcon;
  export const Filter: LucideIcon;
  export const Heart: LucideIcon;
  export const Mail: LucideIcon;
  export const Phone: LucideIcon;
  export const Plus: LucideIcon;
  export const Search: LucideIcon;
  export const Share: LucideIcon;
  export const Star: LucideIcon;
  export const Upload: LucideIcon;
  export const Trash: LucideIcon;
  export const Refresh: LucideIcon;

  // Additional icons used in the project
  export const TrendingUp: LucideIcon;
  export const Activity: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Bug: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Send: LucideIcon;
  export const Bot: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Brain: LucideIcon;
  export const Compass: LucideIcon;
  export const WifiOff: LucideIcon;
  export const Signal: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Minimize2: LucideIcon;
  export const Maximize2: LucideIcon;
  export const Check: LucideIcon;
  export const BookOpen: LucideIcon;
}

declare module 'date-fns' {
  export interface FormatDistanceToNowOptions {
    includeSeconds?: boolean;
    addSuffix?: boolean;
    locale?: any;
  }

  export function formatDistanceToNow(
    date: Date | number,
    options?: FormatDistanceToNowOptions
  ): string;

  // Add other date-fns functions as needed
  export function format(date: Date | number, formatStr: string, options?: any): string;
  export function parseISO(dateString: string): Date;
  export function isValid(date: any): boolean;
}

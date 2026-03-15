import { Wifi, Zap, ShieldCheck, LucideIcon } from 'lucide-react';
import type { Amenity } from '@/lib/types';

interface AmenityIconProps {
  amenity: Amenity;
}

const amenityMap: Record<Amenity, { icon: LucideIcon; label: string }> = {
  wifi: { icon: Wifi, label: 'WiFi' },
  power: { icon: Zap, label: '24/7 Power' },
  security: { icon: ShieldCheck, label: 'Security' },
};

export default function AmenityIcon({ amenity }: AmenityIconProps) {
  const amenityData = amenityMap[amenity];

  if (!amenityData) return null;

  const { icon: IconComponent, label } = amenityData;

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
      <IconComponent className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium text-secondary-foreground">{label}</span>
    </div>
  );
}

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomeHeader() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-primary">Hello, Tunde 👋</h1>
        <p className="text-muted-foreground">Let's find your new home.</p>
      </div>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-6 w-6 text-primary" />
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
        </span>
        <span className="sr-only">View notifications</span>
      </Button>
    </header>
  );
}

import { Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PropertySearch() {
  return (
    <Card className="p-2 shadow-lg">
      <div className="flex items-center gap-2">
        <Input
          type="search"
          placeholder="Where do you want to live?"
          className="flex-grow border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
        />
        <Button variant="accent" size="icon">
          <Filter className="h-5 w-5" />
          <span className="sr-only">Filter</span>
        </Button>
      </div>
    </Card>
  );
}

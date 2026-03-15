'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PropertySearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function PropertySearch({ searchQuery, setSearchQuery }: PropertySearchProps) {
  return (
    <Card className="p-2 shadow-lg">
      <div className="flex items-center gap-2 relative">
        <div className="pl-3 text-muted-foreground pointer-events-none">
          <Search className="h-5 w-5" />
        </div>
        <Input
          type="text"
          placeholder="Where do you want to live?"
          className="flex-grow border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    </Card>
  );
}

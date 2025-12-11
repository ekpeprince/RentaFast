'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const categories = ['All', 'Short-let', 'Flat', 'Duplex', 'Self-con'];

export default function CategoryFilters() {
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4">
      <div className="flex items-center gap-2 whitespace-nowrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant="outline"
            size="sm"
            onClick={() => setActiveCategory(category)}
            className={cn(
              'rounded-full',
              activeCategory === category
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                : 'bg-transparent'
            )}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}

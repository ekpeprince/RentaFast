'use client';

import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

interface PropertySearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  maxPrice: number | null;
  setMaxPrice: (price: number | null) => void;
  minBeds: number;
  setMinBeds: (beds: number) => void;
}

export default function PropertySearch({ 
  searchQuery, 
  setSearchQuery,
  maxPrice,
  setMaxPrice,
  minBeds,
  setMinBeds
}: PropertySearchProps) {
  return (
    <div className="flex flex-col gap-4">
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
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2 border-primary/20">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {(maxPrice !== null || minBeds > 0) && (
                  <span className="flex h-2 w-2 rounded-full bg-accent" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Max Price</Label>
                  <span className="text-sm font-medium text-accent">
                    {maxPrice ? formatCurrency(maxPrice) : 'Any'}
                  </span>
                </div>
                <Slider
                  defaultValue={[maxPrice || 10000000]}
                  max={20000000}
                  step={500000}
                  onValueChange={(vals) => setMaxPrice(vals[0])}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>₦0</span>
                  <span>₦20M+</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-bold">Min Bedrooms</Label>
                <Select value={minBeds.toString()} onValueChange={(val) => setMinBeds(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any</SelectItem>
                    <SelectItem value="1">1+ Bedroom</SelectItem>
                    <SelectItem value="2">2+ Bedrooms</SelectItem>
                    <SelectItem value="3">3+ Bedrooms</SelectItem>
                    <SelectItem value="4">4+ Bedrooms</SelectItem>
                    <SelectItem value="5">5+ Bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="ghost" 
                className="w-full text-xs" 
                onClick={() => {
                  setMaxPrice(null);
                  setMinBeds(0);
                }}
              >
                Reset Filters
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </Card>
    </div>
  );
}

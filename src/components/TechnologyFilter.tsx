import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TechnologyFilterProps {
  technologies: string[];
  selectedTechnologies: string[];
  setSelectedTechnologies: (technologies: string[]) => void;
}

export const TechnologyFilter = ({
  technologies,
  selectedTechnologies,
  setSelectedTechnologies,
}: TechnologyFilterProps) => {
  const toggleTechnology = (tech: string) => {
    if (selectedTechnologies.includes(tech)) {
      setSelectedTechnologies(selectedTechnologies.filter((t) => t !== tech));
    } else {
      setSelectedTechnologies([...selectedTechnologies, tech]);
    }
  };

  const removeTechnology = (tech: string) => {
    setSelectedTechnologies(selectedTechnologies.filter((t) => t !== tech));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Technologies</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between bg-background/50",
              selectedTechnologies.length === 0 && "text-muted-foreground"
            )}
          >
            {selectedTechnologies.length > 0
              ? `${selectedTechnologies.length} selected`
              : "Filter by technology..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search technology..." />
            <CommandEmpty>No technology found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {technologies.map((tech) => (
                <CommandItem
                  key={tech}
                  value={tech}
                  onSelect={() => toggleTechnology(tech)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTechnologies.includes(tech) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tech}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedTechnologies.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTechnologies.map((tech) => (
            <Badge
              key={tech}
              variant="secondary"
              className="bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
              onClick={() => removeTechnology(tech)}
            >
              {tech}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
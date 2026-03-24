
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function GenZToggle() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const isGenzMode = theme === 'theme-genz-dark'

  const toggleGenzMode = () => {
    if (isGenzMode) {
      // If we are in Gen Z mode, switch to the default light theme
      setTheme("theme-blue-light")
      toast({ title: "Gen Z Mode Off" })
    } else {
      // If we are not in Gen Z mode, switch to it
      setTheme("theme-genz-dark")
      toast({ title: "Gen Z Mode On ✨" })
    }
  }

  return (
    <Button
       variant="outline"
       size="sm"
       onClick={toggleGenzMode}
       aria-label="Toggle Gen Z Mode"
       className={cn(
         "rounded-full gap-2 px-4 transition-all duration-500",
         isGenzMode ? "bg-primary/20 border-primary/50 text-primary shadow-lg shadow-primary/10" : "bg-background/50 backdrop-blur-md border-border/50"
       )}
    >
      <Sparkles
        className={cn(
            "h-4 w-4 transition-transform duration-500",
            isGenzMode ? "text-primary scale-125 rotate-12" : "text-muted-foreground"
        )}
      />
      <span className="text-xs font-bold uppercase tracking-widest">Gen Z</span>
    </Button>
  )
}

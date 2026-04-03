"use client";

import { Menu } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Открыть навигацию</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background p-3">
        <AdminSidebar />
      </SheetContent>
    </Sheet>
  );
}

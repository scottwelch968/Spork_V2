import * as React from "react";
import { Drawer } from "./Drawer";
import { Sidebar, SidebarItem } from "./Sidebar";
import { Button } from "./Button";

export function MobileNav({
  title = "Menu",
  sections,
}: {
  title?: string;
  sections: Array<{ title?: string; items: SidebarItem[] }>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="icon" onClick={() => setOpen(true)} aria-label="Open navigation">
        ☰
      </Button>

      <Drawer open={open} onOpenChange={setOpen} title={title}>
        <Sidebar title={title} sections={sections} className="w-full border-r-0 bg-card" />
      </Drawer>
    </>
  );
}

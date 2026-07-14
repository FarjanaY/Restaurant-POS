import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext(null);

// Shared between Sidebar (which reacts to collapsed to resize/hide labels) and
// TopBar (which now owns the toggle button itself, per the "icon lives outside
// the sidebar, beside the search bar" layout) — a Context avoids prop-drilling
// this through every page that renders <TopBar />.
export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);
  return <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider');
  return ctx;
}

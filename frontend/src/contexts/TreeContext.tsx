"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

interface TreeInfo {
  id: number;
  name: string;
  humanId?: number | null;
}

interface TreeContextType {
  currentTreeId: number | null;
  currentHumanId: number | null;
  trees: TreeInfo[];
  setCurrentTree: (id: number) => void;
  refreshTrees: () => Promise<void>;
  loading: boolean;
}

const TreeContext = createContext<TreeContextType>({
  currentTreeId: null,
  currentHumanId: null,
  trees: [],
  setCurrentTree: () => {},
  refreshTrees: async () => {},
  loading: true,
});

export function useTree() {
  return useContext(TreeContext);
}

export function TreeProvider({ children }: { children: ReactNode }) {
  const [trees, setTrees] = useState<TreeInfo[]>([]);
  const [currentTreeId, setCurrentTreeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchTrees = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/v1/user/me");
      const userTrees = res.data.data.trees || [];
      setTrees(userTrees);

      const savedId = localStorage.getItem("currentTreeId");
      if (savedId) {
        const id = Number(savedId);
        if (userTrees.some((t: TreeInfo) => t.id === id)) {
          setCurrentTreeId(id);
        } else if (userTrees.length > 0) {
          setCurrentTreeId(userTrees[0].id);
          localStorage.setItem("currentTreeId", String(userTrees[0].id));
        }
      } else if (userTrees.length > 0) {
        setCurrentTreeId(userTrees[0].id);
        localStorage.setItem("currentTreeId", String(userTrees[0].id));
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  const setCurrentTree = async (id: number) => {
    setCurrentTreeId(id);
    localStorage.setItem("currentTreeId", String(id));

    // Profile and trees list pages — just update context, page re-renders via useTree()
    if (pathname === "/profile" || pathname === "/trees") {
      return;
    }

    // Parse current URL to detect resource type
    const match = pathname.match(/^\/tree\/(\d+)(\/.*)?$/);
    if (!match) {
      router.push(`/tree/${id}/schema`);
      return;
    }

    const suffix = match[2] || "";

    // If on tree root or people list — stay on same type
    if (suffix === "" || suffix === "/") {
      router.push(`/tree/${id}`);
      return;
    }

    // If on schema page — go to schema of new tree
    if (suffix.startsWith("/schema")) {
      router.push(`/tree/${id}/schema`);
      return;
    }

    // If on human page — check if human exists in new tree
    const humanMatch = suffix.match(/^\/human\/(\d+)(\/.*)?$/);
    if (humanMatch) {
      const humanId = Number(humanMatch[1]);
      const sub = humanMatch[2] || "";
      try {
        const res = await api.get(`/v1/humans/${humanId}`);
        if (res.data.data.treeId === id) {
          router.push(`/tree/${id}/human/${humanId}${sub}`);
          return;
        }
      } catch {}
      // Human not in this tree — go to schema
      router.push(`/tree/${id}/schema`);
      return;
    }

    // If on members page — go to members of new tree
    if (suffix.startsWith("/members")) {
      router.push(`/tree/${id}/members`);
      return;
    }

    // Default — go to schema
    router.push(`/tree/${id}/schema`);
  };

  const currentTree = trees.find(t => t.id === currentTreeId);
  const currentHumanId = currentTree?.humanId ?? null;

  return (
    <TreeContext.Provider value={{ currentTreeId, currentHumanId, trees, setCurrentTree, refreshTrees: fetchTrees, loading }}>
      {children}
    </TreeContext.Provider>
  );
}

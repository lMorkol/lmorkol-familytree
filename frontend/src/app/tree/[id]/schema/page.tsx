"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import api, { getApiBaseUrl } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

interface HumanNode {
  id: number;
  firstName?: string;
  secondName?: string;
  patronymic?: string;
  gender: string;
  birthDate?: string;
  deathDate?: string;
  placeOfBirth?: string;
  photo?: string;
}

interface Relation {
  from: number;
  to: number;
  type: string;
  startDate?: string;
  endDate?: string;
}

interface PositionedNode extends HumanNode {
  x: number;
  y: number;
  generation: number;
  isCurrentUser?: boolean;
}

const CARD_W = 170;
const CARD_H = 80;
const GAP_X = 60;
const GAP_Y = 100;
const COUPLE_GAP = 40;

export default function TreeSchemaPage() {
  const router = useRouter();
  const params = useParams();
  const treeId = Number(params.id);
  const [humans, setHumans] = useState<HumanNode[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [treeName, setTreeName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [myHumanId, setMyHumanId] = useState<number | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [photoLightbox, setPhotoLightbox] = useState<string | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const fitRef = useRef({ scale: 1, offset: { x: 0, y: 0 } });

  useEffect(() => {
    scaleRef.current = scale;
    offsetRef.current = offset;
  }, [scale, offset]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    Promise.all([
      api.get(`/v1/trees/${treeId}`),
      api.get(`/v1/trees/${treeId}/structure`),
      api.get("/v1/user/me"),
    ]).then(([treeRes, structRes, userRes]) => {
      setTreeName(treeRes.data.data.name);
      setHumans(structRes.data.data.humans);
      setRelations(structRes.data.data.relations);
      const userTrees = userRes.data.data.trees || [];
      const currentTree = userTrees.find((t: any) => t.id === treeId);
      setMyHumanId(currentTree?.humanId ?? null);
      setLoading(false);
    }).catch(() => router.push("/trees"));
  }, [treeId]);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => Math.min(3, Math.max(0.2, s * delta)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [loading]);

  // Touch handlers via native listeners (passive: false for preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let touchStart: { x: number; y: number } | null = null;
    let pinchState: { dist: number; scale: number; midX: number; midY: number } | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX - offsetRef.current.x, y: e.touches[0].clientY - offsetRef.current.y };
        pinchState = null;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchState = {
          dist: Math.hypot(dx, dy),
          scale: scaleRef.current,
          midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        touchStart = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && touchStart) {
        setOffset({
          x: e.touches[0].clientX - touchStart.x,
          y: e.touches[0].clientY - touchStart.y,
        });
      } else if (e.touches.length === 2 && pinchState) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const newScale = Math.min(3, Math.max(0.2, pinchState.scale * (dist / pinchState.dist)));
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const scaleRatio = newScale / scaleRef.current;
        setOffset({
          x: midX - scaleRatio * (midX - offsetRef.current.x),
          y: midY - scaleRatio * (midY - offsetRef.current.y),
        });
        setScale(newScale);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchStart = null;
        pinchState = null;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        touchStart = { x: t.clientX - offsetRef.current.x, y: t.clientY - offsetRef.current.y };
        pinchState = null;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [loading]);

  const buildLayout = useCallback(() => {
    if (humans.length === 0) return { nodes: [], lines: [] };

    try {

    const humanMap = new Map(humans.map(h => [h.id, h]));
    const spouseOf = new Map<number, number>();
    const childrenOf = new Map<number, number[]>();
    const parentsOf = new Map<number, number[]>();
    const siblingsOf = new Map<number, number[]>();

    relations.forEach(r => {
      if (r.type === "spouse" || r.type === "ex_spouse") {
        spouseOf.set(r.from, r.to);
        spouseOf.set(r.to, r.from);
      }
    });

    // Build siblings from explicit brother/sister relations
    relations.forEach(r => {
      if (r.type === "brother" || r.type === "sister" || r.type === "sibling") {
        if (!siblingsOf.has(r.from)) siblingsOf.set(r.from, []);
        if (!siblingsOf.get(r.from)!.includes(r.to)) siblingsOf.get(r.from)!.push(r.to);
        if (!siblingsOf.has(r.to)) siblingsOf.set(r.to, []);
        if (!siblingsOf.get(r.to)!.includes(r.from)) siblingsOf.get(r.to)!.push(r.from);
      }
    });

    relations.forEach(r => {
      if (r.type === "parent" || r.type === "child") {
        const parentId = r.type === "parent" ? r.from : r.to;
        const childId = r.type === "parent" ? r.to : r.from;
        if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
        childrenOf.get(parentId)!.push(childId);
        if (!parentsOf.has(childId)) parentsOf.set(childId, []);
        parentsOf.get(childId)!.push(parentId);
      }
    });

    // Build sibling groups: people sharing at least one parent (excluding spouses)
    parentsOf.forEach((parents, childId) => {
      parents.forEach(parentId => {
        const siblings = childrenOf.get(parentId) || [];
        siblings.forEach(sibId => {
          if (sibId !== childId) {
            // Skip if they are spouses
            if (spouseOf.get(childId) === sibId || spouseOf.get(sibId) === childId) return;
            if (!siblingsOf.has(childId)) siblingsOf.set(childId, []);
            if (!siblingsOf.get(childId)!.includes(sibId)) {
              siblingsOf.get(childId)!.push(sibId);
            }
          }
        });
      });
    });

    // Find roots
    const childIds = new Set<number>();
    parentsOf.forEach((parents, childId) => {
      if (parents.some(p => humanMap.has(p))) childIds.add(childId);
    });
    const roots = humans.filter(h => !childIds.has(h.id));

    // Assign generations via BFS
    const generation = new Map<number, number>();
    const queue: [number, number][] = [];
    roots.forEach(r => { queue.push([r.id, 0]); generation.set(r.id, 0); });

    while (queue.length > 0) {
      const [id, gen] = queue.shift()!;
      const children = childrenOf.get(id) || [];
      children.forEach(cid => {
        if (!generation.has(cid) || generation.get(cid)! < gen + 1) {
          generation.set(cid, gen + 1);
          queue.push([cid, gen + 1]);
        }
      });
      const sp = spouseOf.get(id);
      if (sp && !generation.has(sp)) {
        generation.set(sp, gen);
        queue.push([sp, gen]);
      }
    }

    humans.forEach(h => {
      if (!generation.has(h.id)) generation.set(h.id, 0);
    });

    // Rule 1: Siblings must be in the same generation (push older down to younger if needed)
    const siblingGroups = new Set<string>();
    humans.forEach(h => {
      const sibs = siblingsOf.get(h.id) || [];
      if (sibs.length === 0) return;
      const group = [h.id, ...sibs].sort((a, b) => a - b);
      const key = group.join("-");
      if (siblingGroups.has(key)) return;
      siblingGroups.add(key);
      const maxGen = Math.max(...group.map(id => generation.get(id) || 0));
      group.forEach(id => generation.set(id, maxGen));
    });

    // Rule 2: Children must always be below parents (iterate until stable)
    let changed = true;
    let iterCount = 0;
    while (changed && iterCount < 50) {
      iterCount++;
      changed = false;
      parentsOf.forEach((parents, childId) => {
        const childGen = generation.get(childId) || 0;
        const maxParentGen = Math.max(...parents.map(p => generation.get(p) || 0));
        if (childGen <= maxParentGen) {
          generation.set(childId, maxParentGen + 1);
          changed = true;
        }
      });
      // Also ensure spouses are in the same generation
      spouseOf.forEach((sp, id) => {
        const gen1 = generation.get(id) || 0;
        const gen2 = generation.get(sp) || 0;
        if (gen1 !== gen2) {
          const min = Math.min(gen1, gen2);
          generation.set(id, min);
          generation.set(sp, min);
          changed = true;
        }
      });
    }

    // Rule 3: Re-enforce siblings same generation after parent-child adjustments
    let sibChanged = true;
    let sibIterCount = 0;
    while (sibChanged && sibIterCount < 50) {
      sibIterCount++;
      sibChanged = false;
      parentsOf.forEach((parents, childId) => {
        parents.forEach(parentId => {
          const siblings = childrenOf.get(parentId) || [];
          const sibGen = generation.get(childId) || 0;
          siblings.forEach(sibId => {
            if (sibId === childId) return;
            if (spouseOf.get(childId) === sibId || spouseOf.get(sibId) === childId) return;
            const otherGen = generation.get(sibId) || 0;
            if (sibGen !== otherGen) {
              const max = Math.max(sibGen, otherGen);
              generation.set(childId, max);
              generation.set(sibId, max);
              sibChanged = true;
            }
          });
        });
      });
      // Re-check parent-child after sibling adjustment
      parentsOf.forEach((parents, childId) => {
        const childGen = generation.get(childId) || 0;
        const maxParentGen = Math.max(...parents.map(p => generation.get(p) || 0));
        if (childGen <= maxParentGen) {
          generation.set(childId, maxParentGen + 1);
          sibChanged = true;
        }
      });
    }

    // Group by generation
    const genGroups = new Map<number, HumanNode[]>();
    humans.forEach(h => {
      const g = generation.get(h.id) || 0;
      if (!genGroups.has(g)) genGroups.set(g, []);
      genGroups.get(g)!.push(h);
    });

    // Sort generations (oldest first = top)
    const sortedGens = Array.from(genGroups.keys()).sort((a, b) => b - a);
    const nodes: PositionedNode[] = [];

    // Build parent pairs (couples) for ordering children
    const parentPairOf = new Map<number, string>();
    parentsOf.forEach((parents, childId) => {
      if (parents.length >= 2) {
        const pairKey = [parents[0], parents[1]].sort((a, b) => a - b).join("-");
        parentPairOf.set(childId, pairKey);
      }
    });

    sortedGens.forEach((gen, genIdx) => {
      const group = genGroups.get(gen)!;
      const y = genIdx * (CARD_H + GAP_Y);

      // Build clusters: group couples with their siblings
      const placed = new Set<number>();
      const clusters: number[][] = [];

      group.forEach(h => {
        if (placed.has(h.id)) return;
        const cluster = [h.id];
        placed.add(h.id);

        // Add spouse FIRST (always same cluster)
        const sp = spouseOf.get(h.id);
        if (sp && group.some(g => g.id === sp) && !placed.has(sp)) {
          cluster.push(sp);
          placed.add(sp);
        }

        // Add siblings of BOTH the person and their spouse
        const allSibs = new Set<number>();
        const addSiblings = (personId: number) => {
          const myPair = parentPairOf.get(personId);
          const sibs = siblingsOf.get(personId) || [];
          sibs.forEach(sibId => {
            if (!placed.has(sibId) && group.some(g => g.id === sibId)) {
              const sibPair = parentPairOf.get(sibId);
              if (!myPair || !sibPair || myPair === sibPair) {
                allSibs.add(sibId);
              }
            }
          });
        };
        addSiblings(h.id);
        if (sp) addSiblings(sp);

        allSibs.forEach(sibId => {
          cluster.push(sibId);
          placed.add(sibId);
          const sibSp = spouseOf.get(sibId);
          if (sibSp && group.some(g => g.id === sibSp) && !placed.has(sibSp)) {
            cluster.push(sibSp);
            placed.add(sibSp);
          }
        });

        clusters.push(cluster);
      });

      const totalWidth = clusters.reduce((sum, cluster) => {
        return sum + cluster.length * CARD_W + (cluster.length - 1) * COUPLE_GAP + GAP_X;
      }, -GAP_X);

      let x = -totalWidth / 2;
      clusters.forEach(cluster => {
        cluster.forEach((id, idx) => {
          const h = humans.find(h => h.id === id)!;
          nodes.push({
            ...h,
            x: x + idx * (CARD_W + COUPLE_GAP),
            y,
            generation: gen,
            isCurrentUser: h.id === myHumanId,
          });
        });
        x += cluster.length * CARD_W + (cluster.length - 1) * COUPLE_GAP + GAP_X;
      });
    });

    // Rule 4: Shift children closer to the center of their parents
    // Build temporary nodeMap for adjustment
    const tempNodeMap = new Map(nodes.map(n => [n.id, n]));
    for (let iteration = 0; iteration < 5; iteration++) {
      parentsOf.forEach((parents, childId) => {
        const childNode = tempNodeMap.get(childId);
        if (!childNode) return;
        const parentNodes = parents.map(p => tempNodeMap.get(p)).filter(Boolean);
        if (parentNodes.length === 0) return;
        const parentCenterX = parentNodes.reduce((sum, p) => sum + p!.x + CARD_W / 2, 0) / parentNodes.length;
        const childCenterX = childNode.x + CARD_W / 2;
        const diff = parentCenterX - childCenterX;
        if (Math.abs(diff) > CARD_W * 0.3) {
          const shift = diff * 0.4;
          childNode.x += shift;
        }
      });
    }

    // Rule 5: Resolve overlaps — push apart any cards that collide within the same generation
    const genNodesMap = new Map<number, PositionedNode[]>();
    nodes.forEach(n => {
      if (!genNodesMap.has(n.generation)) genNodesMap.set(n.generation, []);
      genNodesMap.get(n.generation)!.push(n);
    });
    genNodesMap.forEach(group => {
      group.sort((a, b) => a.x - b.x);
      for (let i = 1; i < group.length; i++) {
        const prev = group[i - 1];
        const curr = group[i];
        const minX = prev.x + CARD_W + 8;
        if (curr.x < minX) {
          curr.x = minX;
        }
      }
    });

    // Build connection lines
    const lines: { x1: number; y1: number; x2: number; y2: number; type: string; startDate?: string; endDate?: string }[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Spouse lines (horizontal)
    const drawnSpouses = new Set<string>();
    relations.forEach(r => {
      if (r.type === "spouse" || r.type === "ex_spouse") {
        const key = [Math.min(r.from, r.to), Math.max(r.from, r.to)].join("-");
        if (drawnSpouses.has(key)) return;
        drawnSpouses.add(key);
        const a = nodeMap.get(r.from);
        const b = nodeMap.get(r.to);
        if (a && b) {
          // Ensure line goes left to right
          const left = a.x < b.x ? a : b;
          const right = a.x < b.x ? b : a;
          // Only draw line if there's a visible gap between cards
          const gap = right.x - (left.x + CARD_W);
          if (gap > 5) {
            lines.push({
              x1: left.x + CARD_W,
              y1: left.y + CARD_H / 2,
              x2: right.x,
              y2: right.y + CARD_H / 2,
              type: "spouse",
              startDate: r.startDate,
              endDate: r.endDate,
            });
          }
        }
      }
    });

    // Sibling lines (bracket connecting siblings)
    const drawnSiblingGroups = new Set<string>();
    humans.forEach(h => {
      const sibs = siblingsOf.get(h.id) || [];
      if (sibs.length === 0) return;
      const group = [h.id, ...sibs].sort((a, b) => a - b);
      const key = group.join("-");
      if (drawnSiblingGroups.has(key)) return;
      drawnSiblingGroups.add(key);

      const groupNodes = group.map(id => nodeMap.get(id)).filter(Boolean) as PositionedNode[];
      if (groupNodes.length < 2) return;

      const minX = Math.min(...groupNodes.map(n => n.x + CARD_W / 2));
      const maxX = Math.max(...groupNodes.map(n => n.x + CARD_W / 2));
      const bracketY = groupNodes[0].y - 12;

      // Horizontal bracket line
      lines.push({
        x1: minX,
        y1: bracketY,
        x2: maxX,
        y2: bracketY,
        type: "sibling",
      });

      // Vertical lines from bracket to each sibling
      groupNodes.forEach(n => {
        lines.push({
          x1: n.x + CARD_W / 2,
          y1: bracketY,
          x2: n.x + CARD_W / 2,
          y2: n.y,
          type: "sibling",
        });
      });
    });

    // Parent-child lines (дедупликация: каждая пара рисуется один раз)
    const drawnParentChild = new Set<string>();
    relations.forEach(r => {
      if (r.type === "parent" || r.type === "child") {
        const parentId = r.type === "parent" ? r.from : r.to;
        const childId = r.type === "parent" ? r.to : r.from;
        const key = `${Math.min(parentId, childId)}-${Math.max(parentId, childId)}`;
        if (drawnParentChild.has(key)) return;
        drawnParentChild.add(key);
        const parent = nodeMap.get(parentId);
        const child = nodeMap.get(childId);
        if (parent && child) {
          const parentMidX = parent.x + CARD_W / 2;
          const childMidX = child.x + CARD_W / 2;
          const midY = (parent.y + CARD_H + child.y) / 2;
          lines.push({
            x1: parentMidX,
            y1: parent.y + CARD_H,
            x2: childMidX,
            y2: child.y,
            type: "child",
            midY,
          } as any);
        }
      }
    });

    return { nodes, lines, error: null };

    } catch (e) {
      console.error("Schema layout error:", e);
      return { nodes: [], lines: [], error: "Ошибка построения схемы. Возможно, есть противоречивые связи (например, человек является одновременно родителем и братом другого человека). Проверьте связи и удалите ошибочные." };
    }
  }, [humans, relations, myHumanId]);

  const { nodes, lines, error: layoutBuildError } = useMemo(() => buildLayout(), [buildLayout]);

  useEffect(() => {
    setLayoutError(layoutBuildError ?? null);
  }, [layoutBuildError]);

  // Compute bounding box
  const bounds = useMemo(() => nodes.length > 0 ? {
    minX: Math.min(...nodes.map(n => n.x)) - 50,
    minY: Math.min(...nodes.map(n => n.y)) - 50,
    maxX: Math.max(...nodes.map(n => n.x + CARD_W)) + 50,
    maxY: Math.max(...nodes.map(n => n.y + CARD_H)) + 50,
  } : { minX: 0, minY: 0, maxX: 800, maxY: 600 }, [nodes]);

  const svgW = useMemo(() => bounds.maxX - bounds.minX, [bounds]);
  const svgH = useMemo(() => bounds.maxY - bounds.minY, [bounds]);

  // Fit tree to screen on load
  useEffect(() => {
    if (loading || !containerRef.current || nodes.length === 0) return;
    const container = containerRef.current;
    const fitScale = Math.min(
      container.clientWidth / svgW,
      container.clientHeight / svgH,
      1
    );
    fitRef.current = { scale: fitScale, offset: {
      x: (container.clientWidth - svgW * fitScale) / 2,
      y: (container.clientHeight - svgH * fitScale) / 2,
    }};
    setScale(fitRef.current.scale);
    setOffset(fitRef.current.offset);
  }, [loading, svgW, svgH, nodes.length]);

  // Refit on resize / orientation change
  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current || nodes.length === 0) return;
      const c = containerRef.current;
      const fitScale = Math.min(c.clientWidth / svgW, c.clientHeight / svgH, 1);
      fitRef.current = { scale: fitScale, offset: {
        x: (c.clientWidth - svgW * fitScale) / 2,
        y: (c.clientHeight - svgH * fitScale) / 2,
      }};
      setScale(fitRef.current.scale);
      setOffset(fitRef.current.offset);
    };
    const onOrientation = () => setTimeout(onResize, 300);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, [loading, svgW, svgH, nodes.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".node-card")) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  if (loading) return <div className="py-10 text-center text-gray-500">Загрузка...</div>;

  if (layoutError) {
    return (
      <div className="h-[100dvh] flex flex-col">
        <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 flex items-center shrink-0">
          <button onClick={() => router.push(`/tree/${treeId}`)} className="flex items-center gap-2 bg-gray-50 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-xs sm:text-sm font-medium min-h-[44px]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="hidden sm:inline">Список людей</span>
          </button>
          <h2 className="font-bold text-gray-800 text-sm sm:text-base ml-4">{treeName} — Семейное древо</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <p className="text-red-700 font-medium mb-2">Не удалось построить схему</p>
            <p className="text-red-600 text-sm">{layoutError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col">
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => router.push(`/tree/${treeId}`)} className="flex items-center gap-2 bg-gray-50 text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-xs sm:text-sm font-medium min-h-[44px]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="hidden sm:inline">Список людей</span>
          </button>
          <h2 className="font-bold text-gray-800 text-sm sm:text-base">{treeName} — Семейное древо</h2>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
          <button onClick={() => setScale(s => Math.min(3, s * 1.2))} className="w-9 h-9 sm:w-auto sm:h-auto flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">+</button>
          <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.max(0.2, s * 0.8))} className="w-9 h-9 sm:w-auto sm:h-auto flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">−</button>
          <button onClick={() => { setScale(fitRef.current.scale); setOffset(fitRef.current.offset); }} className="px-2 sm:px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]">Сброс</button>
          <button onClick={() => setShowLegend(l => !l)} className="sm:hidden px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <div className={`${showLegend ? 'flex' : 'hidden'} sm:flex items-center gap-3 sm:ml-4 text-xs text-gray-500 border-l border-gray-200 sm:pl-4 ${showLegend ? 'fixed bottom-20 right-4 sm:relative sm:bottom-auto sm:right-auto bg-white border rounded-lg p-3 shadow-lg z-50 flex-col' : ''}`}>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-caramel inline-block"></span> Супруги</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-gray-700 inline-block"></span> Родитель-ребёнок</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-gray-500 border-t border-dashed inline-block"></span> Братья/сёстры</span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        style={{ background: "linear-gradient(135deg, #fdf6ee 0%, #f0e6d6 50%, #e8ddd0 100%)" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={svgW}
          height={svgH}
          viewBox={`${bounds.minX} ${bounds.minY} ${svgW} ${svgH}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="0.8" fill="#c9b99a" fillOpacity="0.4" />
            </pattern>
          </defs>
          <rect x={bounds.minX} y={bounds.minY} width={svgW} height={svgH} fill="url(#dots)" />
          <g>
            {lines.map((l, i) => {
              if (l.type === "spouse") {
                const midX = (l.x1 + l.x2) / 2;
                const dateLabel = l.startDate
                  ? new Date(l.startDate).toLocaleDateString("ru-RU")
                  : null;
                return (
                  <g key={i}>
                    <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#D4BBA5" strokeWidth={2} />
                    {dateLabel && (
                      <text x={midX} y={l.y1 - 18} fontSize={10} fontWeight="600" fill="#4A3F33" textAnchor="middle">
                        {dateLabel}
                      </text>
                    )}
                  </g>
                );
              }
              if (l.type === "sibling") {
                return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#8E7A68" strokeWidth={2} strokeDasharray="6,3" />;
              }
              const midY = (l as any).midY || (l.y1 + l.y2) / 2;
              return (
                <path
                  key={i}
                  d={`M ${l.x1} ${l.y1} L ${l.x1} ${midY} L ${l.x2} ${midY} L ${l.x2} ${l.y2}`}
                  fill="none"
                  stroke="#5C4E3D"
                  strokeWidth={2}
                />
              );
            })}

            {nodes.map(n => (
              <g key={n.id} className="node-card" style={{ cursor: "pointer" }} onClick={() => router.push(`/tree/${treeId}/human/${n.id}?from=schema`)}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={CARD_W}
                  height={CARD_H}
                  rx={20}
                  fill={n.gender === "male" ? "#E8DDD0" : "#F5EDE3"}
                  stroke={n.isCurrentUser ? "#4A3F33" : n.gender === "male" ? "#5C4E3D" : "#8E7A68"}
                  strokeWidth={n.isCurrentUser ? 3 : 1.5}
                />
                {n.isCurrentUser && (
                  <text x={n.x + CARD_W / 2} y={n.y - 6} fontSize={11} fontWeight="bold" fill="#4A3F33" textAnchor="middle">
                    Вы
                  </text>
                )}
                {n.photo ? (
                  <>
                    <defs>
                      <clipPath id={`clip-${n.id}`}>
                        <circle cx={n.x + 22} cy={n.y + CARD_H / 2} r={16} />
                      </clipPath>
                    </defs>
                    <image
                      href={`${getApiBaseUrl()}/uploads/${n.photo}`}
                      x={n.x + 6}
                      y={n.y + CARD_H / 2 - 16}
                      width={32}
                      height={32}
                      clipPath={`url(#clip-${n.id})`}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); setPhotoLightbox(`${getApiBaseUrl()}/uploads/${n.photo}`); }}
                    />
                    <circle cx={n.x + 22} cy={n.y + CARD_H / 2} r={16} fill="none" stroke={n.isCurrentUser ? "#4A3F33" : n.gender === "male" ? "#5C4E3D" : "#8E7A68"} strokeWidth={1} />
                  </>
                ) : (
                  <circle cx={n.x + 22} cy={n.y + CARD_H / 2} r={16} fill={n.isCurrentUser ? "#4A3F33" : n.gender === "male" ? "#D4BBA5" : "#E8DDD0"} />
                )}
                <text x={n.x + 48} y={n.y + 20} fontSize={12} fontWeight="bold" fill="#4A3F33">
                  {[n.secondName, n.firstName].filter(Boolean).join(" ") || "—"}
                </text>
                {n.patronymic && (
                  <text x={n.x + 48} y={n.y + 34} fontSize={9} fill="#5C4E3D">
                    {n.patronymic}
                  </text>
                )}
                <text x={n.x + 48} y={n.y + (n.patronymic ? 48 : 40)} fontSize={10} fill="#8E7A68">
                  {n.birthDate ? new Date(n.birthDate).getFullYear() : "?"}{n.deathDate ? ` — ${new Date(n.deathDate).getFullYear()}` : ""}
                </text>
                {n.placeOfBirth && (
                  <text x={n.x + 48} y={n.y + (n.patronymic ? 62 : 54)} fontSize={9} fill="#8E7A68">
                    {n.placeOfBirth}
                  </text>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>

      {photoLightbox && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPhotoLightbox(null)}
        >
          <img
            src={photoLightbox}
            alt=""
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
          />
          <button
            onClick={() => setPhotoLightbox(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

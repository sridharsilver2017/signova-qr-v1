import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Atom, Download, ChevronLeft, ChevronRight, QrCode, ChevronDown, LayoutGrid, Rows3, PackageSearch, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/use-page-meta";
import { fetchProducts, fetchProductCategories, getIcon, getProductImageUrl, Product, ProductCategory } from "@/data/products";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const itemsPerPage = 24;

function Header({ onRefresh }: { onRefresh?: () => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };
  return (
    <div className="sticky top-0 z-40 bg-hero border-b border-white/5 w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between px-5 h-16 relative w-full">
        <div className="flex items-center gap-3.5">
          <div className="size-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-lg shadow-black/10 border border-white/10">
            <QrCode className="size-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-white leading-tight tracking-tight">Signova QRs</h1>
            <p className="text-[11px] text-white/60 leading-tight tracking-wide font-medium">Signova Products</p>
          </div>
        </div>
        
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className={`size-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-all duration-200 border border-white/5 ${
              refreshing ? "animate-spin" : ""
            }`}
            aria-label="Refresh list"
          >
            <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function SearchBar({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-xl pb-3 pt-3 px-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" strokeWidth={2} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products"
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground/40 border border-border/50 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all duration-300 shadow-sm"
        />
      </div>
    </div>
  );
}

function CategoryDropdown({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: ProductCategory[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = categories.find(c => c.slug === activeCategory);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-secondary text-sm font-medium text-foreground border border-border/50 hover:border-primary/20 transition-all duration-200"
      >
        <span className="flex items-center gap-2.5 truncate">
          {active ? (
            <>
              {(() => { const Icon = getIcon(active.icon); return <Icon className="size-4 text-primary" />; })()}
              <span>{active.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">All Categories</span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="size-4 text-muted-foreground/70" strokeWidth={2} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/5 overflow-hidden"
            role="listbox"
            aria-label="Categories"
          >
            <button
              role="option"
              aria-selected={activeCategory === "all"}
              onClick={() => { onSelect("all"); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors ${
                activeCategory === "all"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-secondary/60"
              }`}
            >
              <span className="flex items-center justify-center size-5">
                <PackageSearch className="size-4" strokeWidth={1.5} />
              </span>
              All Categories
              {activeCategory === "all" && <span className="ml-auto text-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.3 4.3a1 1 0 0 1 1.4 1.4l-7 7a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 0 1 1.4-1.4L7 10.6l6.3-6.3z" fill="currentColor"/></svg>
              </span>}
            </button>
            <div className="h-px bg-border/50 mx-3" />
            {categories.filter(c => c.slug !== "all").map(cat => {
              const Icon = getIcon(cat.icon);
              return (
                <button
                  key={cat.id}
                  role="option"
                  aria-selected={activeCategory === cat.slug}
                  onClick={() => { onSelect(cat.slug); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors ${
                    activeCategory === cat.slug
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground/80 hover:bg-secondary/60"
                  }`}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.5} />
                  {cat.name}
                  {activeCategory === cat.slug && <span className="ml-auto text-primary">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.3 4.3a1 1 0 0 1 1.4 1.4l-7 7a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 0 1 1.4-1.4L7 10.6l6.3-6.3z" fill="currentColor"/></svg>
                  </span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryPills({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: ProductCategory[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1 flex items-center gap-2.5 -mx-4 px-4 md:hidden">
      <button
        onClick={() => onSelect("all")}
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
          activeCategory === "all"
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105"
            : "bg-secondary text-foreground/75 active:bg-secondary/90"
        }`}
      >
        <PackageSearch className="size-3.5" strokeWidth={2.5} />
        <span>All</span>
      </button>
      {categories.filter(c => c.slug !== "all").map((cat) => {
        const Icon = getIcon(cat.icon);
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.slug)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
              activeCategory === cat.slug
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105"
                : "bg-secondary text-foreground/75 active:bg-secondary/90"
            }`}
          >
            <Icon className="size-3.5" strokeWidth={2.5} />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function Sidebar({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: ProductCategory[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="w-64 shrink-0 hidden md:flex flex-col gap-6 sticky top-6 self-start h-[calc(100vh-3rem)]">
      {/* Brand Logo / Header inside Sidebar */}
      <div className="flex items-center gap-3 px-2">
        <div className="size-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10">
          <QrCode className="size-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-foreground leading-tight tracking-tight">Signova QRs</h1>
          <p className="text-[11px] text-muted-foreground leading-tight tracking-wide font-medium">Signova Products</p>
        </div>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-1 no-scrollbar">
        <h2 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">Categories</h2>
        <button
          onClick={() => onSelect("all")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
            activeCategory === "all"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10"
              : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground"
          }`}
        >
          <PackageSearch className="size-4 shrink-0" strokeWidth={1.5} />
          <span>All Categories</span>
        </button>
        {categories.filter(c => c.slug !== "all").map((cat) => {
          const Icon = getIcon(cat.icon);
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.slug)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                activeCategory === cat.slug
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10"
                  : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  index,
  onDownload,
}: {
  product: Product;
  index: number;
  onDownload: (product: Product) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 12) * 0.04 }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden flex flex-col active:scale-[0.97] hover:shadow-lg hover:shadow-black/5 hover:border-primary/15 transition-all duration-200"
    >
      <div className="p-3 flex flex-col flex-1">
        {product.image_url ? (
          <div className="relative aspect-square mb-3 rounded-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-leaf/10 via-transparent to-transparent" />
            <img
              src={getProductImageUrl(product.image_url)}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/30 flex items-center justify-center mb-3">
            <Atom className="size-7 text-primary/30" strokeWidth={1.5} />
          </div>
        )}

        <h3 className="text-[13px] font-bold leading-snug text-center text-foreground/90 line-clamp-2 mb-3.5 px-0.5 font-display">
          {product.name}
        </h3>

        <button
          onClick={() => onDownload(product)}
          className="mt-auto w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white bg-green-800 hover:bg-green-700 rounded-xl active:scale-[0.97] transition-all duration-150 shadow-sm shadow-green-800/20"
        >
          <Download className="size-3.5 text-white" strokeWidth={2.5} />
          Download QR
        </button>
      </div>
    </motion.div>
  );
}

function ListProductCard({
  product,
  onDownload,
}: {
  product: Product;
  onDownload: (product: Product) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden active:scale-[0.99] hover:border-primary/15 transition-all duration-200"
    >
      <div className="flex items-center gap-3.5 p-3.5">
        {product.image_url ? (
          <div className="size-14 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-leaf/5 via-transparent to-transparent">
            <img
              src={getProductImageUrl(product.image_url)}
              alt={product.name}
              className="w-full h-full object-contain p-2"
            />
          </div>
        ) : (
          <div className="size-14 shrink-0 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/30 flex items-center justify-center">
            <Atom className="size-5 text-primary/30" strokeWidth={1.5} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold leading-snug text-foreground/90 truncate font-display">
            {product.name}
          </h3>
        </div>

        <button
          onClick={() => onDownload(product)}
          className="shrink-0 size-10 flex items-center justify-center rounded-xl bg-green-800 hover:bg-green-700 active:scale-90 transition-all duration-150 shadow-sm shadow-green-800/20 text-white"
        >
          <Download className="size-4 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );
}

function QRDialog({
  product,
  open,
  onOpenChange,
  baseUrl,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseUrl: string;
}) {
  const [activeTab, setActiveTab] = useState<"product" | "technical">("technical");
  const [saved, setSaved] = useState<"svg" | "png" | null>(null);
  const type = activeTab;

  useEffect(() => {
    if (!open) setSaved(null);
  }, [open]);

  const savedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (saved) {
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(() => setSaved(null), 2500);
    }
    return () => {
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
    };
  }, [saved]);

  const url =
    type === "product"
      ? `${baseUrl}/products/${product.slug}`
      : `${baseUrl}/tech-specs/${product.slug}`;

  const downloadQR = async (format: "svg" | "png") => {
    try {
      const svgEl = document.getElementById(`qr-svg-${type}-${product.id}`) as SVGElement | null;
      if (!svgEl) return;

      const viewBox = svgEl.getAttribute("viewBox") || "0 0 180 180";
      const [, , svgW, svgH] = viewBox.split(" ").map(Number);
      const qrW = svgW || 180;
      const qrH = svgH || 180;

      const content = svgEl.innerHTML;

      const outSize = 1000;
      const margin = 70;
      const available = outSize - 2 * margin;
      const scale = Math.min(available / qrW, available / qrH);
      const qrScaledW = qrW * scale;
      const qrScaledH = qrH * scale;
      const tx = (outSize - qrScaledW) / 2;
      const ty = (outSize - qrScaledH) / 2;

      const wrapped = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${outSize}" height="${outSize}" viewBox="0 0 ${outSize} ${outSize}">
  <rect width="${outSize}" height="${outSize}" fill="white"/>
  <g transform="translate(${tx},${ty}) scale(${scale})">${content}</g>
</svg>`;

      const blob = new Blob([wrapped], { type: "image/svg+xml;charset=utf-8" });
      const filename = `${product.slug}-${type}-qr.${format}`;

      if (format === "svg") {
        await downloadBlob(blob, filename);
        setSaved("svg");
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = outSize;
        canvas.height = outSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) { URL.revokeObjectURL(blobUrl); return; }
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, outSize, outSize);
        ctx.drawImage(img, 0, 0, outSize, outSize);
        URL.revokeObjectURL(blobUrl);
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) return;
          await downloadBlob(pngBlob, filename);
          setSaved("png");
        }, "image/png", 1);
      };
      img.onerror = () => URL.revokeObjectURL(blobUrl);
      img.src = blobUrl;
    } catch (err) {
      console.error("QR download error:", err);
    }
  };

  async function blobToBase64(blob: Blob): Promise<string> {
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function downloadBlob(blob: Blob, filename: string) {
    const isNative = typeof window !== "undefined" && !!(window as any)?.Capacitor;

    if (isNative) {
      try {
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const { Share } = await import("@capacitor/share");
        const base64 = await blobToBase64(blob);
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Cache,
        });
        await Share.share({ title: filename, url: result.uri });
        return;
      } catch (err) {
        console.warn("Capacitor save/share failed:", err);
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm flex flex-col items-center p-0 rounded-2xl gap-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="w-full px-5 pt-5 pb-0">
          <DialogTitle className="text-center text-base">{product.name}</DialogTitle>
          <DialogDescription className="text-center text-xs">Select QR type to download</DialogDescription>
        </DialogHeader>

        <div className="flex w-full px-5 pt-4 pb-1 gap-1">
          <button
            onClick={() => setActiveTab("technical")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "technical"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground active:bg-secondary/80"
            }`}
          >
            Technical
          </button>
          <button
            onClick={() => setActiveTab("product")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "product"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground active:bg-secondary/80"
            }`}
          >
            Product
          </button>
        </div>

        <div className="flex flex-col items-center w-full px-5 pb-5 pt-2">
          <div className="flex items-center justify-center p-4 bg-white rounded-xl my-2 w-[200px] h-[200px]">
            <QRCodeSVG
              id={`qr-svg-${type}-${product.id}`}
              value={url}
              size={180}
            />
          </div>

          <div className="w-full bg-secondary/50 rounded-xl p-2.5 flex items-center justify-between border border-border/50 mb-3">
            <span className="text-[11px] text-muted-foreground truncate mr-2 select-all font-mono">
              {url}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-bold text-primary active:text-primary/80"
            >
              Open
            </a>
          </div>

          <div className="flex gap-2.5 w-full">
            <button
              onClick={() => downloadQR("svg")}
              disabled={!!saved}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 ${
                saved === "svg"
                  ? "bg-green-800/10 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                  : "bg-green-800 hover:bg-green-700 text-white active:scale-[0.98] shadow-sm shadow-green-800/20"
              }`}
            >
              {saved === "svg" ? <CheckCircle2 className="size-3.5" /> : <Download className="size-3.5" />}
              {saved === "svg" ? "Saved!" : "SVG"}
            </button>
            <button
              onClick={() => downloadQR("png")}
              disabled={!!saved}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 ${
                saved === "png"
                  ? "bg-green-800/10 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                  : "bg-green-800 hover:bg-green-700 text-white active:scale-[0.98] shadow-sm shadow-green-800/20"
              }`}
            >
              {saved === "png" ? <CheckCircle2 className="size-3.5" /> : <Download className="size-3.5" />}
              {saved === "png" ? "Saved!" : "PNG"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductsQrPage() {
  usePageMeta({
    title: "Signova QRs",
    description: "Generate QR codes for Signova products.",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [baseUrl, setBaseUrl] = useState("https://signova1.pages.dev");

  const loadData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const isNative = !!(window as any)?.Capacitor;
      const apiBase = isNative ? "https://signova-qr.pages.dev" : "";
      const [products, categories, settingsRes] = await Promise.all([
        fetchProducts(),
        fetchProductCategories(),
        fetch(`${apiBase}/api/settings`).then(r => r.json()).catch(() => ({})),
      ]);
      if (settingsRes.base_url) setBaseUrl(settingsRes.base_url);
      const sortedProducts = products.sort((a, b) => a.name.localeCompare(b.name));
      setProductsList(sortedProducts);
      setProductCategories(categories);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // Poll for updates in the background every 10 seconds for real-time synchronization
    const interval = setInterval(() => {
      loadData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const setActiveCategory = (catId: string) => {
    setCurrentPage(1);
    if (catId === activeCategory) {
      setSearchParams((prev) => {
        prev.delete("category");
        return prev;
      }, { replace: true });
      return;
    }
    setSearchParams((prev) => {
      prev.set("category", catId);
      return prev;
    }, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    return productsList.filter(
      (item) =>
        item.is_active !== false &&
        (activeCategory === "all" || item.category_slug === activeCategory) &&
        (query === "" ||
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()) ||
          item.sku?.toLowerCase().includes(query.toLowerCase()))
    );
  }, [activeCategory, query, productsList]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row gap-6 max-w-7xl mx-auto w-full px-0 md:px-6 py-0 md:py-6">
      <Sidebar
        categories={productCategories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <div className="flex-1 flex flex-col">
        {/* Mobile Header (hidden on tablet/desktop) */}
        <div className="md:hidden">
          <Header onRefresh={() => loadData(true)} />
        </div>

        {/* Controls: Search & Category Filter (mobile only) & View Modes */}
        <div className="sticky top-0 md:relative z-30 bg-background/90 backdrop-blur-xl md:backdrop-blur-none py-3 px-4 md:px-0 flex flex-col gap-3 md:mb-6">
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full h-11 pl-10 pr-4 rounded-2xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground/40 border border-border/50 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all duration-300 shadow-sm"
              />
            </div>

            {/* View Mode Toggle Button Group */}
            <div className="flex items-center gap-0.5 bg-secondary rounded-2xl p-0.5 shrink-0 border border-border/40 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`size-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground/60 hover:text-foreground"
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-[18px]" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`size-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground/60 hover:text-foreground"
                }`}
                aria-label="List view"
              >
                <Rows3 className="size-[18px]" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Category Horizontal Scroll Pills - Mobile only */}
          <CategoryPills
            categories={productCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        {/* Products List Area */}
        <div className="flex-1 px-4 md:px-0 pb-6">
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden p-3">
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 mb-3 shimmer" />
                    <div className="h-4 bg-gradient-to-r from-secondary/60 to-secondary/30 rounded-lg w-3/4 mx-auto mb-3 shimmer" />
                    <div className="h-9 bg-gradient-to-r from-secondary/60 to-secondary/30 rounded-xl mt-auto shimmer" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-14 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 shrink-0 shimmer" />
                      <div className="h-4 bg-gradient-to-r from-secondary/60 to-secondary/30 rounded-lg flex-1 shimmer" />
                      <div className="size-10 rounded-xl bg-gradient-to-r from-secondary/60 to-secondary/30 shrink-0 shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
                  <AnimatePresence mode="popLayout">
                    {paginatedProducts.map((product, index) => (
                      <ProductCard
                        key={product.slug}
                        product={product}
                        index={index}
                        onDownload={setQrProduct}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {paginatedProducts.map((product) => (
                      <ListProductCard
                        key={product.slug}
                        product={product}
                        onDownload={setQrProduct}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {filteredProducts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-24"
                >
                  <div className="size-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4 border border-border/40">
                    <PackageSearch className="size-7 text-muted-foreground/40" strokeWidth={1.5} />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">No products found</p>
                  <p className="text-muted-foreground/50 text-xs mt-1">Try adjusting your search or category filter</p>
                </motion.div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="size-9 flex items-center justify-center rounded-xl bg-card border border-border/50 active:bg-secondary disabled:opacity-30 disabled:active:bg-card transition-all duration-200 text-muted-foreground hover:border-primary/20"
                  >
                    <ChevronLeft className="size-4" strokeWidth={2} />
                  </button>

                  {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="size-9 flex items-center justify-center text-muted-foreground/30 text-xs tracking-widest font-semibold">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p as number)}
                        className={`size-9 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          currentPage === p
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105"
                            : "bg-card border border-border/50 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="size-9 flex items-center justify-center rounded-xl bg-card border border-border/50 active:bg-secondary disabled:opacity-30 disabled:active:bg-card transition-all duration-200 text-muted-foreground hover:border-primary/20"
                  >
                    <ChevronRight className="size-4" strokeWidth={2} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {qrProduct && (
        <QRDialog
          product={qrProduct}
          open={!!qrProduct}
          onOpenChange={(open) => { if (!open) setQrProduct(null); }}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}

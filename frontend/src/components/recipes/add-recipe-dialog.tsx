import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Image as ImageIcon,
  Link as LinkIcon,
  Mic,
  Share2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { useAppStore } from "@/stores/app-store";
import { useAddRecipe } from "@/hooks/use-recipes";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Display } from "@/components/ui/display";
import { Pill } from "@/components/ui/pill";

const ALT_METHODS = [
  { icon: Share2, title: "Share sheet", sub: "From Safari, Instagram, Chrome" },
  { icon: Mic, title: "Voice add", sub: "\"Lasagna from NYT Cooking\"" },
  { icon: ImageIcon, title: "Snap cookbook", sub: "OCR a printed page" },
  { icon: Wand2, title: "Type raw", sub: "Paste ingredient text" },
];

const SAVED_SOURCES = ["NYT Cooking", "Smitten Kitchen", "Bon Appétit", "Food52", "Goop"];

const PARSING_STEPS = [
  "Fetched the page",
  "Spotted ingredients",
  "Matched to your pantry",
  "Grouping by aisle",
];

const PARSING_CHIPS = [
  "chicken thighs",
  "harissa paste",
  "lemon",
  "olive oil",
  "fennel seeds",
  "parsley",
];

export function AddRecipeDialog() {
  const { addRecipeDialogOpen, setAddRecipeDialogOpen } = useAppStore();
  const [url, setUrl] = useState("");
  const addRecipe = useAddRecipe();

  const isParsing = addRecipe.isPending;
  const errorMsg = addRecipe.error?.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    addRecipe.mutate(url.trim(), {
      onSuccess: (recipe) => {
        toast.success(`Added "${recipe.title}"`, {
          description: `${recipe.ingredients.length} ingredients from ${recipe.source_name}`,
        });
        setUrl("");
        addRecipe.reset();
        setAddRecipeDialogOpen(false);
      },
    });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      addRecipe.reset();
      setUrl("");
    }
    setAddRecipeDialogOpen(open);
  };

  return (
    <Dialog open={addRecipeDialogOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-line bg-surface p-0 sm:max-w-md"
        showCloseButton={false}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* top bar */}
        <div className="flex items-center justify-between px-5 pt-2">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="text-sm font-medium text-text-2"
          >
            Cancel
          </button>
          <Eyebrow>Add a recipe</Eyebrow>
          <span className="w-12" aria-hidden />
        </div>

        {/* State: ERROR */}
        {errorMsg && !isParsing && (
          <ErrorState message={errorMsg} onRetry={() => addRecipe.reset()} />
        )}

        {/* State: PARSING */}
        {isParsing && <ParsingState url={url} />}

        {/* State: IDLE (paste form) */}
        {!errorMsg && !isParsing && (
          <form onSubmit={handleSubmit}>
            <div className="px-5 pt-5">
              {/* base-ui Dialog.Title doesn't support asChild — use a
                  visually-hidden title for a11y and render the Display separately. */}
              <DialogTitle className="sr-only">Add a recipe</DialogTitle>
              <DialogDescription className="sr-only">
                Paste a recipe URL — we'll extract ingredients for your list.
              </DialogDescription>
              <Display size="sm">
                Paste a link.
                <br />
                <em className="italic text-olive">We'll do the rest.</em>
              </Display>
            </div>

            {/* URL input */}
            <div className="px-5 pt-5">
              <div className="rounded-2xl border-[1.5px] border-olive bg-surface p-4 shadow-[0_0_0_4px_var(--accent-wash)]">
                <div className="flex items-center gap-2.5">
                  <LinkIcon className="h-4 w-4 text-olive" strokeWidth={1.6} />
                  <input
                    autoFocus
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://cooking.nytimes.com/recipes/…"
                    className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-text placeholder:text-text-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-accent-wash px-3.5 py-2.5 text-[13px] text-accent-ink">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.6} />
                Paste any recipe URL — we'll fetch, parse, and roll it into your list.
              </div>
            </div>

            {/* Alt methods (visual only) */}
            <div className="px-5 pt-5">
              <Eyebrow>Or try another way</Eyebrow>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {ALT_METHODS.map(({ icon: Icon, title, sub }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-line bg-surface-2 p-3.5 opacity-60"
                    aria-disabled="true"
                    title="Coming soon"
                  >
                    <Icon className="h-4 w-4 text-olive" strokeWidth={1.6} />
                    <div className="mt-2 text-sm font-semibold text-text">
                      {title}
                    </div>
                    <div className="mt-0.5 text-[11.5px] leading-tight text-text-3">
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved sources */}
            <div className="px-5 pt-4">
              <Eyebrow>Saved sources</Eyebrow>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {SAVED_SOURCES.map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
                <Pill tone="ghost">+ add</Pill>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-5 border-t border-line-2 bg-surface-2 px-5 py-4">
              <button
                type="submit"
                disabled={!url.trim() || addRecipe.isPending}
                className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-paper transition-opacity disabled:opacity-40"
              >
                Add recipe
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ParsingState({ url }: { url: string }) {
  let host = "";
  try { host = new URL(url).host; } catch { host = ""; }

  return (
    <div>
      <div className="px-5 pt-5">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
            style={{
              background: "linear-gradient(135deg, hsl(28 45% 78%), hsl(28 45% 48%))",
            }}
          >
            🍗
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
              {host || "fetching…"}
            </div>
            <div className="truncate text-[14.5px] font-semibold text-text">
              Reading the page…
            </div>
          </div>
          <div
            className="h-6 w-6 rounded-full border-2 border-line border-t-olive"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
      </div>

      <div className="px-6 pt-5 text-center">
        <Display size="sm">
          Finding the <em className="italic text-olive">good stuff</em>…
        </Display>
      </div>

      <div className="flex flex-wrap justify-center gap-2 px-5 pt-5">
        {PARSING_CHIPS.map((c, i) => (
          <span
            key={c}
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-text"
            style={{ animation: `fadeIn .3s ease ${i * 0.1}s both` }}
          >
            <Check className="h-3 w-3 text-olive" strokeWidth={2.5} />
            {c}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-6 py-6">
        {PARSING_STEPS.map((step, i) => {
          const done = i < PARSING_STEPS.length - 1;
          return (
            <div key={step} className="flex items-center gap-3 text-sm">
              <span
                className={
                  done
                    ? "flex h-[18px] w-[18px] items-center justify-center rounded-full bg-olive"
                    : "flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-line"
                }
              >
                {done ? (
                  <Check className="h-3 w-3 text-paper" strokeWidth={3} />
                ) : (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-text-3"
                    style={{ animation: "pulse 1s infinite" }}
                  />
                )}
              </span>
              <span className={done ? "text-text-2" : "text-text-3"}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div>
      <div className="px-5 pt-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4E4D3] px-2.5 py-1 text-[12px] font-medium text-[#8C4F20]">
          <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
          Couldn't auto-parse
        </span>
        <Display size="sm" className="mt-3">
          This one's <em className="italic">tricky</em>.
        </Display>
        <p className="mt-2 text-[15px] leading-relaxed text-text-2">
          {message}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <button
          type="button"
          onClick={onRetry}
          className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-paper"
        >
          Try another link
        </button>
        <p className="text-center text-[12.5px] text-text-3">
          Direct-paste and OCR fallbacks are on the roadmap.
        </p>
      </div>
    </div>
  );
}

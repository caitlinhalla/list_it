import { Eyebrow } from "@/components/ui/eyebrow";
import { Display } from "@/components/ui/display";

export function HomePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Eyebrow>Home</Eyebrow>
      <Display>Morning.</Display>
      <p className="text-sm text-text-2">
        Home dashboard arrives in Task 10.
      </p>
    </div>
  );
}

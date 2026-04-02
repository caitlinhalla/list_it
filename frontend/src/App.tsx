import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { AppShell } from "@/components/layout/app-shell";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <AppShell />
      </div>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;

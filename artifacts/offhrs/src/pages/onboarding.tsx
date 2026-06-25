import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { useGetMe, getGetMeQueryKey, useUpdateInterests } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const updateInterests = useUpdateInterests();

  const [interests, setInterests] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (user?.onboardingComplete) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const addInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      const newInterest = inputValue.trim();
      if (!interests.includes(newInterest) && interests.length < 15) {
        setInterests([...interests, newInterest]);
      }
      setInputValue("");
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };

  const handleSave = () => {
    if (interests.length < 5) return;
    
    updateInterests.mutate(
      { data: { interests } },
      {
        onSuccess: (updatedUser) => {
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
          setLocation("/dashboard");
        }
      }
    );
  };

  if (isLoadingUser || user?.onboardingComplete) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const isValid = interests.length >= 5 && interests.length <= 15;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col p-8 items-center justify-center relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full relative z-10 bg-card p-10 rounded-2xl border border-border shadow-2xl"
      >
        <h1 className="text-3xl font-semibold tracking-tight mb-3">What are you into?</h1>
        <p className="text-muted-foreground mb-8">
          Tell us what makes you tick. We'll use this to curate your evenings. Add 5 to 15 interests (e.g. "Natural wine", "Pilates", "Jazz").
        </p>

        <div className="space-y-6">
          <div>
            <Label htmlFor="interest-input" className="sr-only">Add an interest</Label>
            <Input
              id="interest-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={addInterest}
              placeholder="Type an interest and press Enter..."
              className="bg-background border-border text-lg py-6 h-auto placeholder:text-muted-foreground/50"
              disabled={interests.length >= 15}
            />
          </div>

          <div className="min-h-[120px] bg-background/50 rounded-lg p-4 border border-border/50 flex flex-wrap gap-2 content-start">
            <AnimatePresence>
              {interests.length === 0 && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-muted-foreground text-sm p-2"
                >
                  No interests added yet.
                </motion.span>
              )}
              {interests.map((interest) => (
                <motion.span
                  key={interest}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                  layout
                  className="inline-flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm font-medium border border-accent/20"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="hover:bg-accent/20 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className={`text-sm ${interests.length < 5 ? 'text-muted-foreground' : 'text-green-400'}`}>
              {interests.length} / 15 added
            </span>
            <Button
              onClick={handleSave}
              disabled={!isValid || updateInterests.isPending}
              className="bg-foreground text-background hover:bg-foreground/90 font-medium px-6"
            >
              {updateInterests.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save & Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

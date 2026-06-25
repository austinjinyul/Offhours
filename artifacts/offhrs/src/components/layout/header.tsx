import { useClerk } from "@clerk/react";
import { Link } from "wouter";
import { LogOut } from "lucide-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Header() {
  const { signOut } = useClerk();
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Offhrs.ai" className="w-6 h-6" />
          <span className="font-semibold tracking-tight text-foreground">Offhrs.ai</span>
        </Link>

        <div className="flex items-center gap-6">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-24 bg-border" />
              <Skeleton className="w-8 h-8 rounded-full bg-border" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                {user.name || user.email}
              </span>
              <Avatar className="w-8 h-8 border border-border">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-background text-foreground text-xs">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="w-px h-4 bg-border"></div>
              <button 
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

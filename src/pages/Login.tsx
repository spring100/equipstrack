import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    document.title = "Connexion — Equipstrack";
  }, []);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Veuillez entrer votre email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/dashboard" },
    });
    if (error) {
      toast.error(error.message);
    } else {
      setMagicLinkSent(true);
      toast.success("Lien de connexion envoyé par email");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/equipstrack-logo.png" alt="Equipstrack" className="h-12 w-auto mx-auto object-contain mb-3" />
          <h1 className="text-2xl font-bold text-primary">Equipstrack</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion d'inventaire intelligente</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Connexion</h2>

          {magicLinkSent ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Un lien de connexion a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.
              </p>
              <Button variant="ghost" className="mt-4" onClick={() => setMagicLinkSent(false)}>
                Retour
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={handleMagicLink} disabled={loading}>
                Recevoir un lien de connexion
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-accent hover:underline font-medium">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

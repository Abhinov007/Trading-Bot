"use client"
import { useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, Loader2 } from "lucide-react"

export default function AuthDialog() {
  const [open, setOpen] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null)

  // Signup state
  const [signupUsername, setSignupUsername] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return
    setLoginLoading(true)
    setLoginError(null)
    setLoginSuccess(null)
    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Login failed")
      setLoginSuccess(`Welcome back, ${data.user?.username || loginEmail}!`)
    } catch (err: any) {
      setLoginError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!signupEmail || !signupPassword || !signupUsername) return
    setSignupLoading(true)
    setSignupError(null)
    setSignupSuccess(null)
    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupUsername,
          email: signupEmail,
          password: signupPassword,
          full_name: signupUsername,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Registration failed")
      setSignupSuccess("Account created! You can now log in.")
    } catch (err: any) {
      setSignupError(err.message)
    } finally {
      setSignupLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white gap-2 h-9"
        >
          <User className="w-4 h-4" />
          Login
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#111111] border-zinc-800 text-white max-w-sm rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-wide text-center text-white">
            Account Access
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full mt-2">
          <TabsList className="grid grid-cols-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1 h-9">
            <TabsTrigger
              value="login"
              className="rounded-md text-xs font-medium data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-500"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="rounded-md text-xs font-medium data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-500"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-widest">Email</Label>
              <Input
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 text-sm h-9 focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-widest">Password</Label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 text-sm h-9 focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
            </div>
            {loginError && <p className="text-xs text-red-400">{loginError}</p>}
            {loginSuccess && <p className="text-xs text-emerald-400">{loginSuccess}</p>}
            <Button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm h-9 mt-1"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-widest">Username</Label>
              <Input
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder="johndoe"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 text-sm h-9 focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-widest">Email</Label>
              <Input
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 text-sm h-9 focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-widest">Password</Label>
              <Input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 text-sm h-9 focus-visible:ring-1 focus-visible:ring-emerald-500"
              />
            </div>
            {signupError && <p className="text-xs text-red-400">{signupError}</p>}
            {signupSuccess && <p className="text-xs text-emerald-400">{signupSuccess}</p>}
            <Button
              onClick={handleSignup}
              disabled={signupLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm h-9 mt-1"
            >
              {signupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

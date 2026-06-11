import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { login } from "~/server/auth";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");

  async function handleLogin() {
    setError("");

    if (!username() || !password()) {
      setError("All fields are required");
      return;
    }

    try {
      await login(username(), password());
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <main class="flex flex-col items-center justify-center min-h-screen px-2">
      <span class="font-semibold mb-4">
        Poopy<span class="text-ctp-blue">market</span>
      </span>

      <div class="rounded-md border bg-ctp-surface0 p-4 max-w-sm">
        <h2 class="text-lg font-bold">Login</h2>
        <p class="text-sm text-ctp-subtext0! mb-4">Welcome back</p>

        <label class="text-sm mb-1">Username</label>
        <input
          type="text"
          value={username()}
          onInput={(e) => setUsername(e.currentTarget.value)}
          class="w-full rounded-lg border bg-ctp-mantle p-2 mb-4"
        />

        <label class="text-sm mb-1">Password</label>
        <input
          type="password"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
          class="w-full rounded-lg border bg-ctp-mantle p-2 mb-4"
        />

        {error() && <p class="text-sm text-ctp-red mb-4">{error()}</p>}

        <button class="w-full rounded-lg p-2" onClick={handleLogin}>
          Login
        </button>
      </div>

      <p class="text-sm text-ctp-subtext0! mt-4">
        Don't have an account?{" "}
        <a href="/register" class="text-ctp-blue">
          Register
        </a>
      </p>
    </main>
  );
}

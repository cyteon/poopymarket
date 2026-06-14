import { revalidate, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { getUser, register } from "~/server/auth";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");

  async function handleRegister() {
    setError("");

    if (!email() || !username() || !password()) {
      setError("All fields are required");
      return;
    }

    try {
      await register(username(), email(), password());
      await revalidate(getUser.key);
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
        <h2 class="text-lg font-bold">Register</h2>
        <p class="text-sm text-ctp-subtext0! mb-4">No real money involved</p>

        <label class="text-sm mb-1">Username</label>
        <input
          type="text"
          value={username()}
          onInput={(e) => setUsername(e.currentTarget.value)}
          class="w-full rounded-lg border bg-ctp-mantle p-2 mb-4"
        />

        <label class="text-sm mb-1">Email</label>
        <input
          type="email"
          value={email()}
          onInput={(e) => setEmail(e.currentTarget.value)}
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

        <button class="w-full rounded-lg p-2" onClick={handleRegister}>
          Register
        </button>
      </div>

      <p class="text-sm text-ctp-subtext0! mt-4">
        Already have an account?{" "}
        <a href="/login" class="text-ctp-blue">
          Login
        </a>
      </p>
    </main>
  );
}

import { Title } from "@solidjs/meta";
import { revalidate, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { getUser, login } from "~/server/auth";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");

  async function handleLogin() {
    setError("");

    if (!identifier() || !password()) {
      setError("All fields are required");
      return;
    }

    try {
      await login(identifier(), password());
      await revalidate(getUser.key);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <>
      <Title>Login - PoopyMarket</Title>

      <main class="flex flex-col items-center justify-center min-h-screen px-2">
        <span class="font-semibold mb-4">
          Poopy<span class="text-ctp-blue">market</span>
        </span>

        <div class="rounded-md border bg-ctp-surface0 p-4 max-w-sm">
          <h2 class="text-lg font-bold">Login</h2>
          <p class="text-sm text-ctp-subtext0! mb-4">Welcome back</p>

          <label class="text-sm mb-1">Username/email</label>
          <input
            type="text"
            value={identifier()}
            onInput={(e) => setIdentifier(e.currentTarget.value)}
            class="w-full rounded-lg border bg-ctp-mantle p-2 mb-4"
          />

          <label class="text-sm mb-1 flex">
            Password
            <a
              class="ml-auto text-ctp-blue text-xs cursor-pointer"
              href="/login/reset"
            >
              Reset password
            </a>
          </label>
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
    </>
  );
}

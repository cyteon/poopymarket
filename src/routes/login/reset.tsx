import { Title } from "@solidjs/meta";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { resetPassword, sendPasswordResetEmail } from "~/server/auth";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = createSignal("");
  const [sent, setSent] = createSignal(false);

  const [newPassword, setNewPassword] = createSignal("");

  const [error, setError] = createSignal("");

  async function handleSendEmail() {
    setError("");

    try {
      await sendPasswordResetEmail(email());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return;
    }
  }

  async function handleResetPassword() {
    setError("");

    try {
      await resetPassword(searchParams.token!, newPassword());
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return;
    }
  }

  return (
    <>
      <Title>Reset Password - Kalshit</Title>

      <main class="flex flex-col items-center justify-center min-h-screen px-2">
        <span class="font-semibold mb-4">
          Poopy<span class="text-ctp-blue">market</span>
        </span>

        <Show when={!searchParams.token}>
          <div class="rounded-md border bg-ctp-surface0 p-4 max-w-sm">
            <h2 class="text-lg font-bold">Reset password</h2>
            <p class="text-sm text-ctp-subtext0! mb-4">
              Enter your email to reset
            </p>

            <label class="text-sm mb-1">Email</label>
            <input
              type="text"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              class="w-full rounded-lg border bg-ctp-mantle p-2 mb-4"
            />

            {error() && <p class="text-sm text-ctp-red mb-4">{error()}</p>}

            <Show when={!sent()}>
              <button class="w-full rounded-lg p-2" onClick={handleSendEmail}>
                Send Email
              </button>
            </Show>

            <Show when={sent()}>
              <button
                class="w-full rounded-lg p-2 ghost border-ctp-surface1! text-ctp-subtext0! text-sm"
                disabled
              >
                Check your email for instructions
              </button>
            </Show>
          </div>
        </Show>

        <Show when={searchParams.token}>
          <div class="rounded-md border bg-ctp-surface0 p-4 max-w-sm">
            <h2 class="text-lg font-bold">Reset password</h2>
            <p class="text-sm text-ctp-subtext0! mb-4">Enter a new password</p>

            <label class="text-sm mb-1">Passsword</label>
            <input
              type="password"
              value={newPassword()}
              onInput={(e) => setNewPassword(e.currentTarget.value)}
              class="w-full rounded-lg border bg-ctp-mantle p-2 mb-4"
            />

            {error() && <p class="text-sm text-ctp-red mb-4">{error()}</p>}

            <button class="w-full rounded-lg p-2" onClick={handleResetPassword}>
              Reset Password
            </button>
          </div>
        </Show>

        <p class="text-sm text-ctp-subtext0! mt-4">
          Happened to remember your password?{" "}
          <a href="/login" class="text-ctp-blue">
            Log in
          </a>
        </p>
      </main>
    </>
  );
}

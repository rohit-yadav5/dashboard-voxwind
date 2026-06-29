import { Button } from "../components/ui.js";

export function loginPage() {
  return {
    render: () => {
      const authOrigin = window.location.hostname === "localhost" ? "http://localhost:8787" : "https://auth.voxwind.com";
      return `
        <main style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--vw-bg); padding: var(--vw-space-4);">
          <div class="vw-card" style="width: 100%; max-width: 380px; padding: var(--vw-space-6); display: flex; flex-direction: column; gap: var(--vw-space-4);">
            <div style="text-align: center;">
              <div class="vw-avatar" style="margin: 0 auto var(--vw-space-3) auto; width: 44px; height: 44px; font-size: 18px; font-weight: 800; border-radius: var(--vw-radius-md); background: var(--vw-primary); color: var(--vw-primary-text);">
                V
              </div>
              <h1 class="vw-h1">Welcome back</h1>
              <p class="vw-text-muted vw-text-sm" style="margin-top: 6px; margin-bottom: 0;">Sign in to your VoxWind Console</p>
            </div>
            
            <div id="login-error" style="display: none; padding: 10px 12px; background: var(--vw-danger-bg); border: 1px solid var(--vw-danger-border); border-radius: var(--vw-radius-sm); color: var(--vw-danger); font-size: 13px;">
            </div>

            <form id="login-form" style="display: flex; flex-direction: column; gap: var(--vw-space-3);">
              <div class="vw-field" style="margin-bottom: 0;">
                <label class="vw-label" for="login-email">Email address</label>
                <input type="email" id="login-email" class="vw-input" placeholder="you@example.com" required autocomplete="email">
              </div>
              <div class="vw-field" style="margin-bottom: 0;">
                <label class="vw-label" for="login-password">Password</label>
                <input type="password" id="login-password" class="vw-input" placeholder="••••••••" required autocomplete="current-password">
              </div>
              
              <button type="submit" class="vw-btn vw-btn-primary" style="width: 100%; justify-content: center; margin-top: 8px;">
                Sign In
              </button>
            </form>
            
            <div style="position: relative; text-align: center; margin: var(--vw-space-2) 0;">
              <div style="position: absolute; top: 50%; left: 0; right: 0; border-top: 1px solid var(--vw-border); z-index: 1;"></div>
              <span style="position: relative; z-index: 2; background: var(--vw-surface); padding: 0 12px; font-size: 11px; color: var(--vw-text-subtle); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">OR</span>
            </div>
            
            <div>
              ${Button({
                label: "Sign in with SSO",
                href: window.location.hostname === "localhost"
                  ? `http://localhost:8789/login.html?redirect=${encodeURIComponent(window.location.origin + "/dashboard")}`
                  : `https://login.voxwind.com/login.html?redirect=${encodeURIComponent(window.location.origin + "/dashboard")}`,
                variant: "secondary",
                extraAttrs: 'style="width: 100%; justify-content: center;"'
              })}
            </div>
          </div>
        </main>
      `;
    },
    afterRender: () => {
      const form = document.getElementById("login-form");
      const errorBox = document.getElementById("login-error");
      const submitBtn = form?.querySelector('button[type="submit"]');
      
      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if (errorBox) {
          errorBox.style.display = "none";
          errorBox.textContent = "";
        }
        
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="vw-spinner" style="margin-right: 8px;"></span> Signing in...';
        }
        
        const email = document.getElementById("login-email")?.value;
        const password = document.getElementById("login-password")?.value;
        
        const authOrigin = window.location.hostname === "localhost" ? "http://localhost:8787" : "https://auth.voxwind.com";
        
        try {
          const res = await fetch(`${authOrigin}/api/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password }),
            credentials: "include"
          });
          
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Invalid email or password");
          }

          const data = await res.json();
          if (data.status === "needs_2fa") {
             throw new Error("2FA is required, please use SSO or login with 2FA enabled clients.");
          }

          window.location.href = "/dashboard";
        } catch (err) {
          if (errorBox) {
            errorBox.textContent = err.message || "An unexpected error occurred.";
            errorBox.style.display = "block";
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign In";
          }
        }
      });
    }
  };
}

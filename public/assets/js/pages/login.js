import { Button } from "../components/ui.js";

export function loginPage() {
  return {
    render: () => {
      const redirectUrl = encodeURIComponent(window.location.origin + "/dashboard");
      const ssoUrl = `https://login.voxwind.com/login.html?redirect=${redirectUrl}`;
      return `
        <main class="login-screen">
          <section class="login-card">
            <div class="brand-mark">V</div>
            <h1>Dashboard sign in</h1>
            <p>Admin authentication is unified. Please sign in via the VoxWind account gateway.</p>
            ${Button({
              label: "Sign in with VoxWind SSO",
              href: ssoUrl,
              variant: "primary",
              extraAttrs: 'style="width: 100%; justify-content: center; min-height: 40px; font-size: 14px;"'
            })}
          </section>
        </main>
      `;
    },
    afterRender: () => {}
  };
}


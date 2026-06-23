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
            <a class="btn btn-primary" href="${ssoUrl}" style="width:100%;margin-top:20px;text-align:center;text-decoration:none;display:inline-block;line-height:40px">
              Sign in with VoxWind SSO
            </a>
          </section>
        </main>
      `;
    },
    afterRender: () => {}
  };
}


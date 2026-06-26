import { getIcon } from "../core/icons.js";
import { createSite } from "../services/admin-api.js";
import { PageHeader, Button } from "../components/ui.js";
import { Card } from "../components/cards.js";
import { TextInput, Textarea } from "../components/forms.js";
import { navigate } from "../core/router.js";

export function createSitePage() {
  let isSubmitting = false;

  return {
    render: async () => {
      return `
        ${PageHeader({
          title: "Create Site",
          subtitle: "Register a new workspace in the VoxWind Console."
        })}
        
        <div style="max-width: 600px; margin-top: var(--vw-space-5);">
          ${Card({
            children: `
              <form id="create-site-form" style="display: flex; flex-direction: column; gap: var(--vw-space-4);">
                ${TextInput({ id: "site-name", label: "Site Name", placeholder: "e.g. My Awesome App" })}
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--vw-space-4);">
                  ${TextInput({ id: "site-slug", label: "Slug (Optional)", placeholder: "my-awesome-app" })}
                  ${TextInput({ id: "site-domain", label: "Primary Domain (Optional)", placeholder: "app.example.com" })}
                </div>
                
                ${TextInput({ id: "site-icon", label: "Icon Name (Optional)", placeholder: "e.g. Activity" })}
                
                ${Textarea({ id: "site-description", label: "Description", placeholder: "Briefly describe this site..." })}
                
                <div id="create-error" style="color: var(--vw-danger); font-size: 14px; display: none; margin-top: 4px;"></div>
                
                <div style="margin-top: var(--vw-space-4); display: flex; gap: var(--vw-space-3);">
                  ${Button({ label: "Create Workspace", extraAttrs: 'type="submit"', id: "submit-btn" })}
                  ${Button({ label: "Cancel", variant: "secondary", href: "/dashboard/sites" })}
                </div>
              </form>
            `
          })}
        </div>
      `;
    },
    afterRender: () => {
      const form = document.getElementById("create-site-form");
      const errorDiv = document.getElementById("create-error");
      const submitBtn = form.querySelector("button[type='submit']");

      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          if (isSubmitting) return;
          
          errorDiv.style.display = "none";
          isSubmitting = true;
          submitBtn.textContent = "Creating...";
          submitBtn.disabled = true;

          const name = document.getElementById("site-name").value;
          const slug = document.getElementById("site-slug").value;
          const primary_domain = document.getElementById("site-domain").value;
          const icon = document.getElementById("site-icon").value;
          const description = document.getElementById("site-description").value;

          try {
            await createSite({
              name,
              slug: slug || undefined,
              primary_domain: primary_domain || undefined,
              icon: icon || undefined,
              description: description || undefined
            });
            navigate("/dashboard/sites");
          } catch (err) {
            errorDiv.textContent = err.message || "Failed to create site.";
            errorDiv.style.display = "block";
          } finally {
            isSubmitting = false;
            submitBtn.textContent = "Create Workspace";
            submitBtn.disabled = false;
          }
        });
      }
    }
  };
}
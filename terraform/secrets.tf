# Secret Manager secrets for Firebase Functions
# Secret versions are added by GitHub Actions CI/CD workflow
# Terraform only manages the secret shells (containers)

# Import existing secrets that were created manually before Terraform.
# These are safe to leave in - if already in state, they're a no-op.
# Note: import blocks don't support for_each until Terraform 1.7.
import {
  to = google_secret_manager_secret.secrets["SMTP_USER"]
  id = "projects/story-6f89f/secrets/SMTP_USER"
}

import {
  to = google_secret_manager_secret.secrets["SMTP_PASS"]
  id = "projects/story-6f89f/secrets/SMTP_PASS"
}

import {
  to = google_secret_manager_secret.secrets["EMAIL_FROM"]
  id = "projects/story-6f89f/secrets/EMAIL_FROM"
}

import {
  to = google_secret_manager_secret.secrets["MAGIC_LINK_REDIRECT_URL"]
  id = "projects/story-6f89f/secrets/MAGIC_LINK_REDIRECT_URL"
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(var.secret_names)
  secret_id = each.value
  project   = var.project_id

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

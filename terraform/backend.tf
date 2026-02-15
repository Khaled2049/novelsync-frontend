terraform {
  backend "gcs" {
    bucket = "story-6f89f-terraform-state"
    prefix = "frontend/state"
  }
}

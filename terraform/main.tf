# Enable required Google Cloud APIs
resource "google_project_service" "firebase" {
  service            = "firebase.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "firebasehosting" {
  service            = "firebasehosting.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudfunctions" {
  service            = "cloudfunctions.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudbuild" {
  service            = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudtasks" {
  service            = "cloudtasks.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secretmanager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "firestore" {
  service            = "firestore.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudrun" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

# App Engine default service account (computed, used by Cloud Functions)
# Format: <project-id>@appspot.gserviceaccount.com
locals {
  appengine_service_account = "${var.project_id}@appspot.gserviceaccount.com"
}

# Get the Cloud Run backend service
data "google_cloud_run_v2_service" "backend" {
  name     = var.backend_service_name
  location = var.region
  project  = var.project_id
}

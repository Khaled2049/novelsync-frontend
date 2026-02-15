# Firestore indexes and configuration
# Note: Firestore database (default) is created separately in CI/CD when needed
# This file can be extended with indexes as needed

# Example: Composite index for invites collection
# Currently, indexes are managed via firebase.json or Console
# Uncomment and adjust as needed when composite indexes are required

# resource "google_firestore_index" "invites_by_status_created" {
#   collection = "invites"
#
#   fields {
#     field_path = "status"
#     order      = "ASCENDING"
#   }
#
#   fields {
#     field_path = "requestedAt"
#     order      = "DESCENDING"
#   }
#
#   database = "(default)"
# }

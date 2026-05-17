# ==============================================================================
# CONTAINER REGISTRY - Where Docker images are stored
# ==============================================================================
# ECR (Elastic Container Registry) is like Docker Hub, but private and in AWS.
# When you push code, the CI/CD pipeline builds a Docker image and stores it here.
# ECS then pulls from here to run your container.
#
# Flow: Code → Docker Image → ECR → ECS runs container
# ==============================================================================

# ------------------------------------------------------------------------------
# ECR REPOSITORY - Storage for your Docker images
# ------------------------------------------------------------------------------

resource "aws_ecr_repository" "api" {
  name = "${var.project_name}-api"

  # Delete images when the repository is deleted
  force_delete = true

  # Scan images for vulnerabilities on push
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-api"
  }
}

# ------------------------------------------------------------------------------
# LIFECYCLE POLICY - Auto-delete old images to save storage costs
# ------------------------------------------------------------------------------
# Only keep the last 5 images. Old ones are automatically deleted.
# This prevents storage costs from growing over time.

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only last 5 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

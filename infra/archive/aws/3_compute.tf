# ==============================================================================
# COMPUTE - ECS Cluster, Task Definition, and Service
# ==============================================================================
# This is where your Go API actually runs!
#
# Hierarchy:
# - CLUSTER: A group that holds your services
# - SERVICE: Keeps your task running (restarts if it crashes)
# - TASK: The actual running container(s)
#
# ┌─────────────────────────────────────────────────────────────┐
# │                      ECS Cluster                             │
# │  ┌───────────────────────────────────────────────────────┐  │
# │  │                    ECS Service                         │  │
# │  │  ┌─────────────────────────────────────────────────┐  │  │
# │  │  │              ECS Task (Container)               │  │  │
# │  │  │  ┌─────────────────────────────────────────┐   │  │  │
# │  │  │  │           Your Go API                    │   │  │  │
# │  │  │  │           (Port 8080)                    │   │  │  │
# │  │  │  └─────────────────────────────────────────┘   │  │  │
# │  │  └─────────────────────────────────────────────────┘  │  │
# │  └───────────────────────────────────────────────────────┘  │
# └─────────────────────────────────────────────────────────────┘
# ==============================================================================

# ------------------------------------------------------------------------------
# ECS CLUSTER - The container for your services
# ------------------------------------------------------------------------------

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  # Disable Container Insights to save costs (~$5/month)
  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

# ------------------------------------------------------------------------------
# CAPACITY PROVIDERS - Use Fargate Spot for 70% cost savings!
# ------------------------------------------------------------------------------
# Fargate Spot uses spare AWS capacity at a discount.
# Your container might get interrupted (rare), but it's much cheaper.

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE_SPOT", "FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT" # Use Spot by default (cheap!)
    weight            = 1
  }
}

# ------------------------------------------------------------------------------
# IAM ROLE - Permissions for ECS to pull images and write logs
# ------------------------------------------------------------------------------

resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ------------------------------------------------------------------------------
# TASK DEFINITION - Blueprint for your container
# ------------------------------------------------------------------------------
# Defines: which image to run, how much CPU/RAM, environment variables, etc.

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-task"
  network_mode             = "awsvpc" # Required for Fargate
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "${var.project_name}-api"
    image     = "${aws_ecr_repository.api.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    # Environment variables passed to your Go API
    environment = [
      { name = "DB_HOST", value = var.db_host },
      { name = "DB_USER", value = var.db_user },
      { name = "DB_PASSWORD", value = var.db_password },
      { name = "DB_NAME", value = "postgres" },
      { name = "DB_PORT", value = "5432" },
      { name = "JWT_SECRET", value = var.jwt_secret },
      { name = "INTERNAL_API_KEY", value = var.internal_api_key }
    ]

    # Logging disabled to save costs
    # Uncomment to enable CloudWatch logs for debugging:
    # logConfiguration = {
    #   logDriver = "awslogs"
    #   options = {
    #     "awslogs-group"         = "/ecs/${var.project_name}"
    #     "awslogs-region"        = var.aws_region
    #     "awslogs-stream-prefix" = "api"
    #   }
    # }
  }])
}

# ------------------------------------------------------------------------------
# ECS SERVICE - Keeps your task running
# ------------------------------------------------------------------------------
# The service ensures your task is always running.
# If the container crashes, the service restarts it automatically.

resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  launch_type     = "FARGATE"

  # THIS IS THE COST CONTROL SWITCH!
  # 0 = API off (no cost), 1 = API on (~$5/month)
  desired_count = var.api_enabled ? 1 : 0

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true # Container gets a public IP
  }

  # Don't let Terraform update the task definition
  # (CI/CD handles deployments, not Terraform)
  lifecycle {
    ignore_changes = [task_definition]
  }
}

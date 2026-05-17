data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name_prefix}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_exec" {
  statement {
    sid = "Logs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}:*",
    ]
  }

  statement {
    sid = "SecretsRead"
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    resources = [aws_secretsmanager_secret.app.arn]
  }
}

resource "aws_iam_role_policy" "lambda" {
  name   = "${var.name_prefix}-exec"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_exec.json
}

# Values are also passed to Lambda env at deploy time so the current Go binary
# (env-based config) works unchanged. HITL: rotate secrets in SM as needed.
resource "aws_secretsmanager_secret" "app" {
  name = "${var.name_prefix}/app-config"
}

locals {
  secret_payload = {
    DB_HOST          = var.db_host
    DB_USER          = var.db_user
    DB_PASSWORD      = var.db_password
    DB_NAME          = var.db_name
    DB_PORT          = var.db_port
    DB_SSLMODE       = var.db_sslmode
    JWT_SECRET       = var.jwt_secret
    INTERNAL_API_KEY = var.internal_api_key
    REDIS_URL        = var.redis_url
  }
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id     = aws_secretsmanager_secret.app.id
  secret_string = jsonencode(local.secret_payload)
}

resource "aws_lambda_function" "api" {
  function_name = var.name_prefix
  role            = aws_iam_role.lambda.arn
  handler         = "bootstrap"
  runtime         = "provided.al2023"
  architectures   = ["x86_64"]
  timeout         = 30
  memory_size     = 256

  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      PORT             = "8080"
      DB_HOST          = var.db_host
      DB_USER          = var.db_user
      DB_PASSWORD      = var.db_password
      DB_NAME          = var.db_name
      DB_PORT          = var.db_port
      DB_SSLMODE       = var.db_sslmode
      JWT_SECRET       = var.jwt_secret
      INTERNAL_API_KEY = var.internal_api_key
      REDIS_URL        = var.redis_url
    }
  }
}

resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "NONE"
}

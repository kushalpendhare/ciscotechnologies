# terraform/modules/iam/main.tf
# IAM roles and policies for ECS tasks
# Tasks assume a role to get temporary credentials for AWS services (S3, Secrets Manager, CloudWatch, etc.)

# ECS task execution role — allows ECS agent to pull images, read secrets, write logs
resource "aws_iam_role" "ecs_task_execution_role" {
  name_prefix = "${var.project_name}-ecs-task-execution-role-"

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

# Attach AWSTask ExecutionRole policy — allows pulling images from ECR and writing logs
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow ECS to read secrets from Secrets Manager
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name_prefix = "ecs-secrets-"
  role        = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:${var.project_name}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

# ECS task role — allows containers to access AWS services (CloudWatch, Secrets Manager, etc.)
resource "aws_iam_role" "ecs_task_role" {
  name_prefix = "${var.project_name}-ecs-task-role-"

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

# Allow tasks to write CloudWatch logs
resource "aws_iam_role_policy" "ecs_task_cloudwatch_logs" {
  name_prefix = "ecs-logs-"
  role        = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "arn:aws:logs:*:*:log-group:/ecs/${var.project_name}/*"
    }]
  })
}

# Allow tasks to read from Secrets Manager (runtime)
resource "aws_iam_role_policy" "ecs_task_secrets" {
  name_prefix = "ecs-task-secrets-"
  role        = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = "arn:aws:secretsmanager:*:*:secret:${var.project_name}/*"
    }]
  })
}

# ALB role (for access logs to S3 if needed)
resource "aws_iam_role" "alb_logs" {
  name_prefix = "${var.project_name}-alb-logs-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "elasticloadbalancing.amazonaws.com"
      }
    }]
  })
}

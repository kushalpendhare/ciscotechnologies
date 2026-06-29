# terraform/modules/iam/outputs.tf
output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution_role.arn
}

output "ecs_task_role_arn" {
  value = aws_iam_role.ecs_task_role.arn
}

output "alb_logs_role_arn" {
  value = aws_iam_role.alb_logs.arn
}

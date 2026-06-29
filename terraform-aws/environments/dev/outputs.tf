# terraform/environments/dev/outputs.tf
output "alb_dns_name" {
  value       = module.ecs.alb_dns_name
  description = "ALB DNS name — point your domain CNAME here"
}

output "ecr_api_repository_url" {
  value       = module.ecr.api_repository_url
  description = "ECR URL for API images — push here instead of GHCR"
}

output "ecr_frontend_repository_url" {
  value       = module.ecr.frontend_repository_url
  description = "ECR URL for frontend images"
}

output "rds_endpoint" {
  value       = module.rds.db_endpoint
  description = "RDS connection endpoint"
}

output "cloudwatch_log_group" {
  value       = module.ecs.cloudwatch_log_group
  description = "CloudWatch log group for ECS — view logs here"
}

output "db_host" {
  value = module.rds.db_host
}

output "db_port" {
  value = module.rds.db_port
}

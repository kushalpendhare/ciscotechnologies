# terraform/modules/ecs/outputs.tf
output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the load balancer (use this for your domain)"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "api_service_name" {
  value = aws_ecs_service.api.name
}

output "frontend_service_name" {
  value = aws_ecs_service.frontend.name
}

output "cloudwatch_log_group" {
  value = aws_cloudwatch_log_group.ecs.name
}

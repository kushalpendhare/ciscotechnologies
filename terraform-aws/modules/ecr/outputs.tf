# terraform/modules/ecr/outputs.tf
output "api_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "api_repository_name" {
  value = aws_ecr_repository.api.name
}

output "frontend_repository_name" {
  value = aws_ecr_repository.frontend.name
}

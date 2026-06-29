# terraform/modules/rds/outputs.tf
output "db_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "RDS endpoint (host:port)"
}

output "db_name" {
  value = aws_db_instance.postgres.db_name
}

output "db_username" {
  value     = aws_db_instance.postgres.username
  sensitive = true
}

output "db_password" {
  value     = aws_db_instance.postgres.password
  sensitive = true
}

output "db_host" {
  value = split(":", aws_db_instance.postgres.endpoint)[0]
}

output "db_port" {
  value = aws_db_instance.postgres.port
}

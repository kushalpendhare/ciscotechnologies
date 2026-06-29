# terraform/modules/secrets/outputs.tf
output "salesforce_secret_arn" {
  value = aws_secretsmanager_secret.salesforce.arn
}

output "database_secret_arn" {
  value = aws_secretsmanager_secret.database.arn
}

# terraform/modules/secrets/main.tf
# AWS Secrets Manager — store Salesforce API credentials securely
# Tasks read these at runtime; credentials are encrypted at rest and in transit

resource "aws_secretsmanager_secret" "salesforce" {
  name_prefix             = "${var.project_name}/salesforce-"
  description             = "Salesforce integration credentials"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-salesforce-secret"
  }
}

resource "aws_secretsmanager_secret_version" "salesforce" {
  secret_id = aws_secretsmanager_secret.salesforce.id
  secret_string = jsonencode({
    SF_INSTANCE_URL  = var.sf_instance_url
    SF_CLIENT_ID     = var.sf_client_id
    SF_CLIENT_SECRET = var.sf_client_secret
    SF_USERNAME      = var.sf_username
    SF_PASSWORD_TOKEN = var.sf_password_token
  })
}

resource "aws_secretsmanager_secret" "database" {
  name_prefix             = "${var.project_name}/database-"
  description             = "PostgreSQL credentials"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-database-secret"
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    DB_HOST     = var.db_host
    DB_PORT     = var.db_port
    DB_NAME     = var.db_name
    DB_USER     = var.db_user
    DB_PASSWORD = var.db_password
  })
}

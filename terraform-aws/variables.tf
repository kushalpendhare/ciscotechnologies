# terraform/variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "cisco"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "container_port" {
  description = "Port exposed by Docker containers"
  type        = number
  default     = 5000
}

variable "api_image" {
  description = "Docker image URI for API (from ECR)"
  type        = string
  # Will be set in environment tfvars
}

variable "frontend_image" {
  description = "Docker image URI for frontend"
  type        = string
}

variable "sf_instance_url" {
  description = "Salesforce instance URL"
  type        = string
  sensitive   = true
}

variable "sf_client_id" {
  description = "Salesforce Connected App Client ID"
  type        = string
  sensitive   = true
}

variable "sf_client_secret" {
  description = "Salesforce Connected App Client Secret"
  type        = string
  sensitive   = true
}

variable "sf_username" {
  description = "Salesforce integration user username"
  type        = string
  sensitive   = true
}

variable "sf_password_token" {
  description = "Salesforce integration user password + security token"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "ciscoAdmin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password (auto-generated if not provided)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway (costs ~$32/month)"
  type        = bool
  default     = true
}

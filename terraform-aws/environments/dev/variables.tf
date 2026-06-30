# terraform/environments/dev/variables.tf
variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "project_name" {
  type    = string
  default = "cisco"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "frontend_port" {
  type    = number
  default = 80
}

variable "api_port" {
  type    = number
  default = 5000
}

variable "api_image" {
  type        = string
  description = "Docker image URI for API (set in terraform.tfvars)"
}

variable "frontend_image" {
  type        = string
  description = "Docker image URI for frontend (set in terraform.tfvars)"
}

variable "sf_instance_url" {
  type      = string
  sensitive = true
}

variable "sf_client_id" {
  type      = string
  sensitive = true
}

variable "sf_client_secret" {
  type      = string
  sensitive = true
}

variable "sf_username" {
  type      = string
  sensitive = true
}

variable "sf_password_token" {
  type      = string
  sensitive = true
}

variable "db_username" {
  type      = string
  sensitive = true
  default   = "ciscoAdmin"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "enable_nat_gateway" {
  type    = bool
  default = true
}

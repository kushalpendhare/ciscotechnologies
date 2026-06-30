# terraform/modules/ecs/variables.tf
variable "project_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "ecs_tasks_security_group_id" {
  type = string
}

variable "frontend_port" {
  type = number
}

variable "api_port" {
  type = number
}

variable "api_image" {
  type = string
}

variable "frontend_image" {
  type = string
}

variable "ecs_task_execution_role_arn" {
  type = string
}

variable "ecs_task_role_arn" {
  type = string
}

variable "salesforce_secret_arn" {
  type = string
}

variable "database_secret_arn" {
  type = string
}

# terraform/modules/secrets/variables.tf
variable "project_name" {
  type = string
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

variable "db_host" {
  type = string
}

variable "db_port" {
  type = number
}

variable "db_name" {
  type = string
}

variable "db_user" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

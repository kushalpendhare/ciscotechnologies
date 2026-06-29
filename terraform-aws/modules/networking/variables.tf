# terraform/modules/networking/variables.tf
variable "vpc_cidr" {
  type = string
}

variable "project_name" {
  type = string
}

variable "container_port" {
  type = number
}

variable "enable_nat_gateway" {
  type = bool
}
